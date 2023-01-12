import jsConvert from "js-convert-case";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "./database";

const optionNames = {
    COLUMN: "column",
    VALUES: "values",
    WHERE: "where",
    ORDER_BY: "orderBy",
    LIMIT: "limit"
} as const;

export interface SelectOption {
    columns?: Array<string> | undefined;
    where?: string | undefined;
    orderBy?: string | undefined;
    limit?: number | undefined;
}

export const select = async (tableName: string, options: SelectOption): Promise<Array<any>> => {
    const sql: string = createSelectSql(tableName, options);
    const conn = await db.getConnection();
    const [row] = await conn.query<RowDataPacket[]>(sql);
    conn.release();

    const result = rowDataToModel(row);

    return result;
};

export const editWithSQL = async (sql: string): Promise<ResultSetHeader> => {
    const conn = await db.getConnection();
    const [response] = await conn.query<ResultSetHeader>(sql);
    conn.release();

    return response;
};

const createSelectSql = (tableName: string, options: SelectOption): string => {
    let columns: string = "*",
        where: string = "",
        orderBy: string = "",
        limit: string = "";

    for (const [key, value] of Object.entries(options)) {
        switch (key) {
            case optionNames.COLUMN:
                if (value instanceof Array<string>) columns = value.join(", ");
                break;
            case optionNames.WHERE:
                where = `where ${value}`;
                break;
            case optionNames.ORDER_BY:
                orderBy = `order by ${value}`;
                break;
            case optionNames.LIMIT:
                limit = `limit ${value}`;
                break;
            default:
                break;
        }
    }

    const sql = `SELECT ${columns} FROM ${tableName} ${where} ${orderBy} ${limit};`;

    return sql;
};

const rowDataToModel = (data: RowDataPacket[]): Array<any> => {
    const result: Array<any> = [];

    data.forEach((item: any) => {
        const convertData: object | null = jsConvert.camelKeys(item, { recursive: true });

        if (convertData) result.push(Object.assign(convertData));
    });

    return result;
};
