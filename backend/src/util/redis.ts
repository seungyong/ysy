import * as redis from "redis";
import dotenv from "dotenv";
import ConflictError from "../error/conflict";

dotenv.config();

const username = process.env.REDIS_USERNAME;
const password = process.env.REDIS_PASSWORD;
const host = process.env.REDIS_HOST;
const port = process.env.REDIS_PORT;
const redisClient = redis.createClient({
    url: `redis://${username}:${password}@${host}:${port}`,
    legacyMode: true,
    socket: {
        connectTimeout: 50000
    }
});

redisClient.on("connect : ", () => console.log("Connect!"));
redisClient.on("error : ", (err: any) => console.log("Error! : ", err));
redisClient.connect();

export const set = async (key: string, value: any): Promise<string | null> => {
    const isOk: string | null = await redisClient.v4.set(key, value);

    return isOk;
};

export const get = async (key: string): Promise<string | null> => {
    const data: string | null = await redisClient.v4.get(key);

    return data;
};
