import express, { Router, Request, Response, NextFunction } from "express";
import joi, { ValidationResult } from "joi";
import formidable from "formidable";

import coupleController from "../controller/couple.controller";

import logger from "../logger/logger";
import validator from "../util/validator";
import StatusCode from "../util/statusCode";

import InternalServerError from "../error/internalServer";
import ForbiddenError from "../error/forbidden";
import BadRequestError from "../error/badRequest";

import { ITokenResponse } from "../model/auth.model";
import { Couple } from "../model/couple.model";

const router: Router = express.Router();

const signupSchema: joi.Schema = joi.object({
    userId: joi.number().required(),
    userId2: joi.number().required(),
    title: joi.string().required(),
    cupDay: joi.date().required()
});

const updateSchema: joi.Schema = joi.object({
    userId: joi.number().required(),
    cupId: joi.string().required(),
    title: joi.string(),
    cupDay: joi.date()
});

// Get Couple Info
router.get("/:cup_id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.body.userId);
        const cupId = req.body.cupId;

        if (isNaN(userId)) throw new BadRequestError("Invalid User Id");
        else if (!cupId) throw new ForbiddenError("Invalid Couple Id");
        else if (cupId !== req.params.cup_id) throw new ForbiddenError("Not Same Couple Id");

        const result: Couple = await coupleController.getCouple(cupId);

        logger.debug(`Response Data : ${JSON.stringify(result)}`);
        return res.status(StatusCode.OK).json(result);
    } catch (_error) {
        next(_error);
    }
});

// Signup Couple
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
        try {
            if (err) throw new err();

            req.body = Object.assign({}, req.body, fields);

            const { value, error }: ValidationResult = validator(req.body, signupSchema);

            if (error) throw new BadRequestError("Bad Request Error");
            if (Object.keys(files).length === 1) req.body.thumbnail = files.file;

            const result: ITokenResponse = await coupleController.createCouple(req.body);

            logger.debug(`Response Data : ${JSON.stringify(result)}`);
            return res.status(StatusCode.CREATED).json(result);
        } catch (_error) {
            next(_error);
        }
    });
});

// Update Couple Info
router.patch("/:cup_id", async (req: Request, res: Response, next: NextFunction) => {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
        try {
            if (err) throw new InternalServerError("Image Server Error");

            req.body = Object.assign({}, req.body, fields);

            const { value, error }: ValidationResult = validator(req.body, updateSchema);

            if (error) throw new BadRequestError("Bad Request Error");
            else if (!req.body.file && !req.body.title && !req.body.cupDay) throw new BadRequestError("Bad Request Error");
            else if (req.body.cupId !== req.params.cup_id) throw new ForbiddenError("Not Same Couple Id");

            let file: any = undefined;
            if (Object.keys(files).length === 1) file = files.file;

            await coupleController.updateCouple(req.body, file);

            return res.status(StatusCode.NO_CONTENT).json({});
        } catch (_error) {
            next(_error);
        }
    });
});

// Delete Couple
router.delete("/:cup_id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.body.userId);
        const cupId = req.body.cupId;

        if (isNaN(userId)) throw new BadRequestError("Invalid User Id");
        else if (!cupId) throw new ForbiddenError("Invalid Couple Id");
        else if (req.body.cupId !== req.params.cup_id) throw new ForbiddenError("Not Same Couple Id");

        const result: ITokenResponse = await coupleController.deleteCouple(userId, cupId);

        logger.debug(`Response Data : ${JSON.stringify(result)}`);
        return res.status(StatusCode.NO_CONTENT).json(result);
    } catch (_error) {
        next(_error);
    }
});

export default router;
