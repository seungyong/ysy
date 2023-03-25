import { Transaction } from "sequelize";

import { Service } from "./service";

import { Couple } from "../model/couple.model";

import { deleteFile } from "../util/firebase";

class CoupleAdminService extends Service {
    getURL(...args: any[]): string {
        throw new Error("Method not implemented.");
    }

    select(...args: any[]): Promise<any> {
        throw new Error("Method not implemented.");
    }

    create(transaction: Transaction | null, ...args: any[]): Promise<any> {
        throw new Error("Method not implemented.");
    }

    update(transaction: Transaction | null, ...args: any[]): Promise<any> {
        throw new Error("Method not implemented.");
    }

    async delete(transaction: Transaction | null, couple: Couple): Promise<any> {
        await couple.destroy({ transaction });
    }
}

export default CoupleAdminService;
