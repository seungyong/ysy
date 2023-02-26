import express, { Router, Request, Response, NextFunction } from "express";
import joi, { ValidationResult } from "joi";
import formidable, { File } from "formidable";

import coupleController from "../controller/couple.controller";

import logger from "../logger/logger";
import validator from "../util/validator";
import StatusCode from "../util/statusCode";

import InternalServerError from "../error/internalServer";
import ForbiddenError from "../error/forbidden";
import BadRequestError from "../error/badRequest";

import { ITokenResponse } from "../model/auth.model";
import { Couple, IRequestCreate, IUpdate } from "../model/couple.model";

const router: Router = express.Router();

const signupSchema: joi.Schema = joi.object({
    userId2: joi.number().required(),
    title: joi.string().required(),
    cupDay: joi.date().required()
});

const updateSchema: joi.Schema = joi.object({
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
    } catch (error) {
        next(error);
    }
});

// Create Couple
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    const form = formidable({ multiples: false, maxFileSize: 5 * 1024 * 1024 });

    form.parse(req, async (err, fields, files) => {
        try {
            if (err) throw new err();

            req.body = Object.assign({}, req.body, fields);

            const { value, error }: ValidationResult = validator(req.body, signupSchema);
            const file: File | undefined = !(files.file instanceof Array<formidable.File>) ? files.file : undefined;

            if (error) throw new BadRequestError("Bad Request Error");

            const data: IRequestCreate = {
                userId: req.body.userId,
                userId2: req.body.userId2,
                cupDay: req.body.cupDay,
                title: req.body.title
            };

            const result: ITokenResponse = await coupleController.createCouple(data, file);

            logger.debug(`Response Data : ${JSON.stringify(result)}`);
            return res.status(StatusCode.CREATED).json(result);
        } catch (error) {
            next(error);
        }
    });
});

// Update Couple Info
router.patch("/:cup_id", async (req: Request, res: Response, next: NextFunction) => {
    const form = formidable({ multiples: false, maxFileSize: 5 * 1024 * 1024 });

    form.parse(req, async (err, fields, files) => {
        try {
            if (err) throw new InternalServerError("Image Server Error");

            req.body = Object.assign({}, req.body, fields);

            const { value, error }: ValidationResult = validator(req.body, updateSchema);
            const file: File | undefined = !(files.file instanceof Array<formidable.File>) ? files.file : undefined;

            if (error) throw new BadRequestError(error.message);
            else if (!file && !req.body.title && !req.body.cupDay) throw new BadRequestError("Update values is not changed");
            else if (req.body.cupId !== req.params.cup_id) throw new ForbiddenError("Not matched couple id");

            const data: IUpdate = {
                userId: req.body.userId,
                cupId: req.body.cupId,
                cupDay: req.body.cupDay,
                title: req.body.title
            };

            await coupleController.updateCouple(data, file);

            return res.status(StatusCode.NO_CONTENT).json({});
        } catch (error) {
            next(error);
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
    } catch (error) {
        next(error);
    }
});

export default router;
