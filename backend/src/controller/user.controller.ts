import dayjs from "dayjs";
import randomString from "randomstring";
import { Op, OrderItem, WhereOptions } from "sequelize";
import { File } from "formidable";

import { User, ICreate, IUpdate, IUserResponse, IUserResponseWithCount, PageOption, SearchOption, FilterOption, IUpdateAll } from "../model/user.model";

import logger from "../logger/logger";
import { deleteFile, isDefaultFile, uploadFile } from "../util/firebase";
import { createDigest } from "../util/password";

import NotFoundError from "../error/notFound";
import ForbiddenError from "../error/forbidden";
import UnauthorizedError from "../error/unauthorized";
import ConflictError from "../error/conflict";
import { UserRole } from "../model/userRole.model";
import sequelize from "../model";
import { boolean } from "boolean";

const folderName = "users";

const createSort = (sort: string): OrderItem => {
    let result: OrderItem = ["name", "ASC"];

    switch (sort) {
        case "na":
            result = ["name", "ASC"];
            break;
        case "nd":
            result = ["name", "DESC"];
            break;
        case "r":
            result = ["createdTime", "DESC"];
            break;
        case "o":
            result = ["createdTime", "ASC"];
            break;
        case "dr":
            result = ["deletedTime", "DESC"];
            break;
        case "do":
            result = ["deletedTime", "ASC"];
            break;
        default:
            result = ["name", "ASC"];
            break;
    }

    return result;
};

const createWhere = (searchOptions: SearchOption, filterOption: FilterOption): WhereOptions => {
    let result: WhereOptions = {};

    if (searchOptions.name && searchOptions.name !== "undefined") result["name"] = { [Op.like]: `%${searchOptions.name}%` };
    if (searchOptions.snsId && searchOptions.snsId !== "undefined") result["snsId"] = searchOptions.snsId;
    if (filterOption.isCouple) result["cupId"] = { [Op.not]: null };
    if (filterOption.isDeleted) result["deleted"] = true;

    return result;
};

const controller = {
    /**
     * 유저와 커플의 정보를 가져옵니다.
     * @param userId User Id
     * @returns A {@link IUserResponse}
     */
    getUsers: async (userId: number): Promise<IUserResponse> => {
        const user1: User | null = await User.findOne({
            attributes: { exclude: ["password"] },
            where: {
                userId: userId
            }
        });
        let user2: User | null = null;

        if (!user1) throw new UnauthorizedError("Invalid Token (User not found using token)");

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
            couple: user2
        };

        return result;
    },
    /**
     * Admin API 전용이며 Pagination, Sort, Search 등을 사용하여 검색할 수 있습니다.
     * ```typescript
     * const pageOption: PageOption = {
     *      page: 1,
     *      count 5,
     *      sort: "r"
     * };
     * // This object value not required.
     * const searchOption: SearchOption = {
     *      name: "용",     // This using mysql "Like" method.
     *      snsId: 1001
     * };
     * const filterOption: FilterOption = {
     *      isCouple: true,     // Get only users with couple.
     *      isDeleted: true     // Get only deleted users.
     * };
     *
     * const result = await getUsersWithSearch(pageOption, searchOption, filterOption);
     * ```
     * @param pageOption A {@link PageOption}
     * @param searchOption A {@link SearchOption}
     * @param filterOption A {@link FilterOption}
     * @returns A {@link IUserResponseWithCount}
     */
    getUsersWithSearch: async (pageOption: PageOption, searchOption: SearchOption, filterOption: FilterOption): Promise<IUserResponseWithCount> => {
        const offset = (pageOption.page - 1) * pageOption.count;
        const sort: OrderItem = createSort(pageOption.sort);
        const where: WhereOptions = createWhere(searchOption, filterOption);

        const { rows, count }: { rows: User[]; count: number } = await User.findAndCountAll({
            offset: offset,
            limit: pageOption.count,
            order: [sort],
            where
        });

        const result: IUserResponseWithCount = {
            users: rows,
            count: count
        };

        return result;
    },
    /**
     * 유저 정보를 생성합니다.
     * @param data A {@link ICreate}
     */
    createUser: async (data: ICreate): Promise<void> => {
        let isNot = true;
        let code = "";
        const user: User | null = await User.findOne({
            where: {
                [Op.or]: [{ email: data.email }, { phone: data.phone }]
            }
        });

        if (user) throw new ConflictError("Duplicated User");

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

        const transaction = await sequelize.transaction();
        const hash: string = await createDigest(data.password);
        data.code = code;
        data.password = hash;

        try {
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

            await UserRole.create(
                {
                    userId: createdUser.userId,
                    roleId: 4
                },
                { transaction }
            );

            transaction.commit();
        } catch (error) {
            transaction.rollback();
            throw error;
        }

        logger.debug(`Created User => ${data.email}`);
    },
    /**
     * 유저의 정보를 수정합니다.
     * @param data A {@link IUpdate}
     * @param profile User Profile
     */
    updateUser: async (data: IUpdate, profile?: File): Promise<void> => {
        let isUpload = false;
        let path: string | null = "";

        const user: User | null = await User.findOne({
            where: {
                userId: data.userId
            }
        });

        if (!user) throw new NotFoundError("Not Found User");
        else if (user.deleted) throw new ForbiddenError("Forbidden Error");

        let prevProfile: string | null = user.profile;

        try {
            if (profile) {
                const reqFileName = profile.originalFilename!;
                const isDefault = isDefaultFile(reqFileName);

                /**
                 * Frontend에선 static으로 default.jpg,png,svg 셋 중 하나 갖고있다가
                 * 사용자가 profile을 내리면 그걸로 넣고 요청
                 */
                if (isDefault) {
                    path = null;
                } else {
                    path = `${folderName}/${data.userId}/profile/${dayjs().valueOf()}.${reqFileName}`;

                    await uploadFile(path, profile.filepath);
                    isUpload = true;
                }

                data.profile = path;
            }

            await user.update(data);
            logger.debug(`Update Data => ${JSON.stringify(data)}`);

            // 이미 profile이 있다면 Firebase에서 삭제
            if (prevProfile && data.profile) {
                await deleteFile(prevProfile);
                logger.debug(`Deleted already profile => ${prevProfile}`);
            }
        } catch (error) {
            // Firebase에는 업로드 되었지만 DB 오류가 발생했다면 Firebase Profile 삭제
            if (data.profile && isUpload) {
                await deleteFile(path!);
                logger.error(`After updating the firebase, a db error occurred and the firebase profile is deleted => ${path}`);
            }

            throw error;
        }
    },
    /**
     * Admin API이며 전용이며, 기존 Update보다 더 많은 정보를 수정할 수 있습니다.
     * ```typescript
     * const userId = 24;
     * 
     * // Object value not required. (Allow undefined)
     * const data: IUpdateAll = {
     *      name: "이름",
            email: "email@email.com",
            code: "AAAAAA",                             // 영어 대소문자 및 숫자로 이루어진 6글자
            password: "password123!",                   // 8~15글자 및 특수문자를 포함해야 함
            phone: "01085297193",
            birthday: 2000-11-26,                       // 1980-01-01 ~ 2023-12-31
            primaryNofi: true,      
            eventNofi: true,
            dateNofi: false,
            deleted: false                              // 실제 DB에서 삭제되지 않습니다.
     * };
     * 
     * await updateUserWithAdmin(userId, data);
     * await updateUserWithAdmin(userId, data, file);   // update or create profile
     * 
     * ```
     * @param userId User Id
     * @param data A {@link IUpdateAll}
     * @param file A {@link File}
     */
    updateUserWithAdmin: async (userId: number, data: IUpdateAll, file?: File): Promise<void> => {
        let isUpload = false;
        let path: string | null = "";

        const user: User | null = await User.findOne({
            where: { userId }
        });
        if (!user) throw new NotFoundError("Not Found User");
        let prevProfile: string | null = user.profile;

        const transaction = await sequelize.transaction();

        try {
            if (data.role) {
                const userRole: UserRole | null = await UserRole.findOne({ where: { userId } });

                if (!userRole) throw new NotFoundError(`Not found User Role. userId : ${userId}`);
                await userRole.update({ roleId: data.role }, { transaction });
            }
            if (file) {
                const reqFileName = file.originalFilename!;
                const isDefault = isDefaultFile(reqFileName);

                /**
                 * Frontend에선 static으로 default.jpg,png,svg 셋 중 하나 갖고있다가
                 * 사용자가 profile을 내리면 그걸로 넣고 요청
                 */
                if (isDefault) {
                    path = null;
                } else {
                    path = `${folderName}/${userId}/profile/${dayjs().valueOf()}.${reqFileName}`;

                    await uploadFile(path, file.filepath);
                    isUpload = true;
                }

                data.profile = path;
            }
            if (data.password) data.password = await createDigest(data.password);
            if (boolean(data.deleted)) data.deletedTime = new Date(dayjs().valueOf());
            else if (data.deleted !== undefined && boolean(data.deleted) === false) data.deletedTime = null;

            await user.update(data, { transaction });
            logger.debug(`Update Data => ${JSON.stringify(data)}`);

            // 이미 profile이 있다면 Firebase에서 삭제
            if (prevProfile && data.profile) {
                await deleteFile(prevProfile);
                logger.debug(`Deleted already profile => ${prevProfile}`);
            }

            transaction.commit();
        } catch (error) {
            transaction.rollback();

            // Firebase에는 업로드 되었지만 DB 오류가 발생했다면 Firebase Profile 삭제
            if (data.profile && isUpload) {
                await deleteFile(path!);
                logger.error(`After updating the firebase, a db error occurred and the firebase profile is deleted => ${path}`);
            }

            throw error;
        }
    },
    /**
     * 사용자 정보 삭제이며, Couple이 있는 경우 Frontend에서 연인 끊기 후 삭제를 요청.
     * @param userId User Id
     */
    deleteUser: async (userId: number): Promise<void> => {
        const user: User | null = await User.findOne({ where: { userId: userId } });

        if (!user) throw new NotFoundError("Not Found User");

        await user.update({
            deleted: true,
            deletedTime: new Date(dayjs().valueOf())
        });

        if (user.profile) await deleteFile(user.profile);
        logger.debug(`Success Deleted userId => ${userId}`);
    },
    /**
     * Admin API 전용이며, 1개 이상의 유저를 DB 데이터에서 삭제합니다.
     * @param userIds User Id List
     */
    deleteUserWithAdmin: async (userIds: number[]): Promise<void> => {
        await User.destroy({ where: { userId: userIds } });
    }
};

export default controller;
