import dayjs from "dayjs";
import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";

import UnauthorizedError from "../error/unauthorized";

dotenv.config();

const SECRET_KEY: string = String(process.env.AUTH_SECRET_KEY);
const accessTokenOptions: object = {
    algorithm: process.env.ALGORITHM,
    expiresIn: process.env.DEVELOPMENT_ACCESSTOKEN_EXPIRES_IN,
    issuer: process.env.ISSUER
} as const;

const refreshTokenexpiresIn: object = {
    algorithm: process.env.ALGORITHM,
    expiresIn: process.env.DEVELOPMENT_JWT_REFRESHTOKEN_EXPIRES_IN
};

export default {
    createAccessToken: (userId: number): string => {
        let payload = { userId: userId };

        return jwt.sign(payload, SECRET_KEY, accessTokenOptions);
    },
    createRefreshToken: (): string => {
        return jwt.sign({}, SECRET_KEY, refreshTokenexpiresIn);
    },
    getExpired: (): number => {
        const now = dayjs();
        const expiresIn = now.add(Number(process.env.DEVELOPMENT_EX_REFRESHTOKEN_EXPIRES_IN), "day");

        return expiresIn.diff(now, "second");
    },
    verify: (token: string, ignoreExpiration: boolean = false): JwtPayload | string => {
        const [bearer, separatedToken] = token.split(" ");
        if (bearer !== "Bearer") throw new UnauthorizedError("Invalid Token");

        const result: JwtPayload | string = jwt.verify(separatedToken, SECRET_KEY, { ignoreExpiration: ignoreExpiration });

        return result;
    }
};
