import dayjs from "dayjs";
import randomString from "randomstring";

import { User, ICreateData, IDeleteData, IRequestUpdateData } from "../model/user.model";

import { deleteFile, uploadFile } from "../util/firebase";
import { createDigest } from "../util/password";

import NotFoundError from "../error/notFound";
import ForbiddenError from "../error/forbidden";
import UnauthorizedError from "../error/unauthorized";

const folderName = "profiles";

const controller = {
    getUser: async (userId: number): Promise<User> => {
        const user: User | null = await User.findOne({
            attributes: { exclude: ["password"] },
            where: {
                userId: userId
            }
        });

        if (!user) throw new UnauthorizedError("Invalid Token (User not found using token)");

        if (user.cupId !== null) {
            // Couple Select
        }

        return user;
    },
    createUser: async (data: ICreateData): Promise<void> => {
        let isNot = true;
        let code = "";

        // 중복된 code가 있는지 검사
        while (isNot) {
            code = randomString.generate({
                length: 6,
                charset: "alphanumeric"
            });

            const user: User | null = await User.findOne({
                where: {
                    code: code
                }
            });

            if (!user) isNot = false;
        }

        const hash: string = await createDigest(data.password);
        data.code = code;
        data.password = hash;

        await User.create({
            snsId: data.snsId,
            code: code,
            name: data.name,
            email: data.email,
            birthday: new Date(data.birthday),
            password: hash,
            phone: data.phone,
            eventNofi: data.eventNofi
        });
    },
    updateUser: async (data: IRequestUpdateData): Promise<void> => {
        let isUpload = false;
        let fileName: string | null = "";

        const user: User | null = await User.findOne({
            where: {
                userId: data.userId
            }
        });

        if (!user) throw new NotFoundError("Not Found User");
        else if (user.deleted) throw new ForbiddenError("Forbidden Error");

        const updateData: any = {
            userId: data.userId
        };

        if (data.name) updateData.name = data.name;
        if (data.primaryNofi !== undefined) updateData.primaryNofi = data.primaryNofi;
        if (data.dateNofi !== undefined) updateData.dateNofi = data.dateNofi;
        if (data.eventNofi !== undefined) updateData.eventNofi = data.eventNofi;

        let prevProfile: string | null = user.profile;

        try {
            if (data.profile) {
                const reqFileName = data.profile.originalFilename;

                /**
                 * Frontend에선 static으로 default.jpg,png,svg 셋 중 하나 갖고있다가
                 * 사용자가 profile을 내리면 그걸로 넣고 요청
                 */
                if (reqFileName === "default.jpg" || reqFileName === "default.png" || reqFileName === "default.svg") {
                    fileName = null;
                } else {
                    fileName = `${data.userId}.${dayjs().valueOf()}.${data.profile.originalFilename!}`;

                    await uploadFile(fileName, folderName, data.profile.filepath);
                    isUpload = true;
                }

                updateData.profile = fileName;
            }

            await user.update(updateData);

            // 이미 profile이 있다면 Firebase에서 삭제
            if (prevProfile) await deleteFile(prevProfile, folderName);
        } catch (error) {
            // Firebase에는 업로드 되었지만 DB 오류가 발생했다면 Firebase Profile 삭제
            if (data.profile && isUpload) await deleteFile(fileName!, folderName);

            throw error;
        }
    },
    deleteUser: async (data: IDeleteData): Promise<void> => {
        await User.update(
            {
                deleted: true,
                deletedTime: new Date(dayjs().valueOf())
            },
            {
                where: {
                    userId: data.userId
                }
            }
        );
    }
};

export default controller;
