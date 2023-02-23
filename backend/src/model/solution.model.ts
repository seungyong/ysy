import dayjs from "dayjs";
import { DataTypes, Model, literal, NonAttribute } from "sequelize";
import { CreationOptional, InferAttributes, InferCreationAttributes } from "sequelize/types/model";

import sequelize from ".";
import { Inquire } from "./inquire.model";

// -------------------------------------------- Interface ------------------------------------------ //
export interface ICreate {
    inquireId: number;
    title: string;
    contents: string;
}

export interface IUpdate {
    inquireId: number;
    title: string;
    contents: string;
    image: string;
}
// ------------------------------------------ Interface End ---------------------------------------- //

export class Solution extends Model<InferAttributes<Solution>, InferCreationAttributes<Solution>> {
    /** If you use include inquire, You can use inquire field. */
    declare inquire?: NonAttribute<Inquire>;

    declare solutionId: CreationOptional<number>;
    declare inquireId: number;
    declare title: string;
    declare contents: string;
    declare createdTime: CreationOptional<Date>;
}

Solution.init(
    {
        solutionId: {
            field: "solution_id",
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        inquireId: {
            field: "inquire_id",
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: Inquire,
                key: "inquire_id"
            }
        },
        title: {
            type: DataTypes.STRING(30),
            allowNull: false
        },
        contents: {
            type: DataTypes.STRING(300),
            allowNull: false
        },
        createdTime: {
            field: "created_time",
            type: "TIMESTAMP",
            defaultValue: literal("CURRENT_TIMESTAMP"),
            get(this: Solution): string | null {
                const date = dayjs(this.getDataValue("createdTime"));
                const formatDate = date.format("YYYY-MM-DD HH:mm:ss");

                return date.isValid() ? formatDate : null;
            }
        }
    },
    {
        sequelize: sequelize,
        tableName: "solution",
        timestamps: false
    }
);
