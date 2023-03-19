import dayjs from "dayjs";
import { File } from "formidable";
import randomString from "randomstring";
import { Op, Transaction, WhereOptions } from "sequelize";

import { API_ROOT } from "..";

import { Service } from "./service";

import logger from "../logger/logger";
import { User, IUserResponse, ICreate, IUpdateWithService } from "../model/user.model";

import UnauthorizedError from "../error/unauthorized";
import ConflictError from "../error/conflict";

import { deleteFile, isDefaultFile, uploadFile } from "../util/firebase";
import { createDigest } from "../util/password";

import NotFoundError from "../error/notFound";
import ForbiddenError from "../error/forbidden";

class UserService extends Service {
    private FOLDER_NAME = "users";

    private async createCode(): Promise<string> {
        let isNot = true;
        let code = "";

        while (isNot) {
            code = randomString.generate({
                length: 6,
                charset: "alphanumeric"
            });

            const user: User | null = await User.findOne({
                where: { code }
            });

            if (!user) isNot = false;
        }

        return code;
    }

    private createProfilePath(userId: number, file: File): string | null {
        let path: string | null = "";
        const reqFileName = file.originalFilename!;
        const isDefault = isDefaultFile(reqFileName);

        /**
         * Frontend에선 static으로 default.jpg,png,svg 셋 중 하나 갖고있다가
         * 사용자가 profile을 내리면 그걸로 넣고 요청
         */
        if (isDefault) path = null;
        else path = `${this.FOLDER_NAME}/${userId}/profile/${dayjs().valueOf()}.${reqFileName}`;

        return path;
    }

    getURL(): string {
        return `${API_ROOT}/user/me`;
    }

    async select(where: WhereOptions<User>): Promise<User | null> {
        const user: User | null = await User.findOne({ where });
        return user;
    }

    async selectForResponse(userId: number): Promise<IUserResponse> {
        const user1: User | null = await User.findOne({
            attributes: { exclude: ["password"] },
            where: { userId }
        });

        let user2: User | null = null;

        if (!user1) throw new UnauthorizedError("User not found with given ID");

        if (user1.cupId !== null) {
            user2 = await User.findOne({
                attributes: { exclude: ["password"] },
                where: {
                    cupId: user1.cupId,
                    [Op.not]: {
                        userId: user1.userId
                    }
                }
            });
        }

        const result: IUserResponse = {
            ...user1.dataValues,
            couple: user2 ? user2 : undefined
        };

        return result;
    }

    async create(transaction: Transaction | null = null, data: ICreate): Promise<User> {
        const user: User | null = await this.select({ email: data.email, phone: data.phone });
        if (user) throw new ConflictError("Duplicated User");

        const hash: string = await createDigest(data.password);
        const code = await this.createCode();

        const createdUser: User = await User.create(
            {
                snsId: data.snsId,
                code: code,
                name: data.name,
                email: data.email,
                birthday: new Date(data.birthday),
                password: hash,
                phone: data.phone,
                eventNofi: data.eventNofi
            },
            { transaction }
        );

        return createdUser;
    }

    async update(transaction: Transaction | null = null, user: User, data: IUpdateWithService, file?: File): Promise<User> {
        if (user.deleted) throw new ForbiddenError("User is deleted");

        let isUpload = false;
        let path: string | null = "";
        let prevProfile: string | null = user.profile;

        try {
            if (file) {
                data.profile = this.createProfilePath(user.userId, file);

                // profile 있으면 업로드
                if (data.profile) {
                    await uploadFile(data.profile, file.filepath);
                    isUpload = true;

                    if (prevProfile) await deleteFile(prevProfile); // 전에 있던 profile 삭제
                } else if (prevProfile && !data.profile) {
                    // default 이미지로 변경시
                    await deleteFile(prevProfile);
                }
            }

            await user.update(data, { transaction });

            return user;
        } catch (error) {
            // Firebase에는 업로드 되었지만 DB 오류가 발생했다면 Firebase Profile 삭제
            if (data.profile && isUpload) {
                await deleteFile(path!);
                logger.error(`After updating the firebase, a db error occurred and the firebase profile is deleted => ${path}`);
            }

            throw error;
        }
    }

    async delete(transaction: Transaction | null = null, user: User): Promise<void> {
        if (!user) throw new NotFoundError("Not Found User");

        await user.update(
            {
                deleted: true,
                deletedTime: new Date(dayjs().valueOf())
            },
            { transaction }
        );

        logger.debug(`Success Deleted userId => ${user.userId}`);
    }
}

export default UserService;
