import randomString from "randomstring";

import BadRequestError from "../error/badRequest";
import ConflictError from "../error/conflict";

import sequelize from "../model";
import { Couple, IRequestData } from "../model/couple.model";
import { User } from "../model/user.model";

const controller = {
    createCouple: async (data: IRequestData): Promise<void> => {
        const t = await sequelize.transaction();

        try {
            let isNot = true;
            let cupId = "";

            // 중복된 Id인지 검사
            while (isNot) {
                cupId = randomString.generate({
                    length: 8,
                    charset: "alphanumeric"
                });

                const user: User | null = await User.findOne({
                    where: { cupId: cupId }
                });

                if (!user) isNot = false;
            }

            await Couple.create(
                {
                    cupId: cupId,
                    cupDay: data.cupDay,
                    title: data.title,
                    thumbnail: data.thumbnail
                },
                { transaction: t }
            );

            const user1: User | null = await User.findOne({
                where: { userId: data.userId }
            });

            const user2: User | null = await User.findOne({
                where: { userId: data.userId2 }
            });

            if (!user1 || !user2) throw new BadRequestError("Bad Request");
            else if (user1.cupId || user2.cupId) throw new ConflictError("Duplicated Cup Id");

            await user1.update(
                { cupId: cupId },
                {
                    where: { userId: data.userId },
                    transaction: t
                }
            );

            await user2.update(
                { cupId: cupId },
                {
                    where: { userId: data.userId2 },
                    transaction: t
                }
            );

            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
};

export default controller;
