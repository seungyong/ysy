import express, { Router, Request, Response, NextFunction } from "express";
import joi, { ValidationResult } from "joi";

import logger from "../logger/logger";
import validator from "../util/validator";
import StatusCode from "../util/statusCode";

import authController from "../controller/auth.controller";

import BadRequestError from "../error/badRequest";
import UnauthorizedError from "../error/unauthorized";

const router: Router = express.Router();

const pwPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,15}$/;

const loginSchema: joi.Schema = joi.object({
    email: joi.string().trim().email().required(),
    password: joi.string().trim().min(8).max(15).regex(RegExp(pwPattern)).required()
});

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    const { value, error }: ValidationResult = validator(req.body, loginSchema);

    try {
        if (error) throw new BadRequestError("Bad Request Error");

        const result = await authController.login(value);

        logger.debug(`Response Data : ${JSON.stringify(result)}`);
        return res.status(StatusCode.OK).json(result);
    } catch (error) {
        next(error);
    }
});

router.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.header("Authorization");
        const refreshToken = req.header("Refresh");

        if (!accessToken || !refreshToken) throw new UnauthorizedError("Invalid Token");

        const result = await authController.updateToken(accessToken, refreshToken);

        logger.debug(`Response Data : ${JSON.stringify(result)}`);
        return res.status(StatusCode.OK).json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
