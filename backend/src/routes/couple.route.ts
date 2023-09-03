import express, { Router, Request, Response, NextFunction } from "express";
import joi, { ValidationResult } from "joi";
import formidable, { File } from "formidable";

import { Couple } from "../models/couple.model";

import logger from "../logger/logger";
import validator from "../utils/validator.util";
import { ContentType } from "../utils/router.util";

import { STATUS_CODE } from "../constants/statusCode.constant";
import { MAX_FILE_SIZE } from "../constants/file.constant";

import InternalServerError from "../errors/internalServer.error";
import ForbiddenError from "../errors/forbidden.error";
import BadRequestError from "../errors/badRequest.error";
import UnauthorizedError from "../errors/unauthorized.error";

import { ResponseToken } from "../types/auth.type";
import { CreateCouple, UpdateCouple } from "../types/couple.type";

import CoupleController from "../controller/couple.controller";
import CoupleService from "../services/couple.service";
import UserService from "../services/user.service";
import UserRoleService from "../services/userRole.service";

const router: Router = express.Router();
const coupleSerivce = new CoupleService();
const userService = new UserService();
const userRoleService = new UserRoleService();
const coupleController = new CoupleController(coupleSerivce, userService, userRoleService);

const createSchema: joi.Schema = joi.object({
  otherCode: joi.string().length(6).required(),
  cupDay: joi.date().required()
});

const updateSchema: joi.Schema = joi.object({
  cupDay: joi.date()
});

// 커플 정보 가져오기
router.get("/:cup_id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cupId: string | null = req.cupId;

    if (!cupId) throw new ForbiddenError("You must request couple ID");
    else if (cupId !== req.params.cup_id) throw new ForbiddenError("You don't same token couple ID and path parameter couple ID");

    const result: Couple = await coupleController.getCouple(cupId);

    logger.debug(`Response Data : ${JSON.stringify(result)}`);
    return res.status(STATUS_CODE.OK).json(result);
  } catch (error) {
    next(error);
  }
});

// 커플 생성
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  const contentType: ContentType | undefined = req.contentType;
  const form = formidable({ multiples: false, maxFileSize: MAX_FILE_SIZE });

  const createFunc = async (req: Request, thumbnail?: File) => {
    try {
      const { value, error }: ValidationResult = validator(req.body, createSchema);
      if (error) throw new BadRequestError(error.message);

      const data: CreateCouple = {
        otherCode: value.otherCode,
        cupDay: value.cupDay
      };

      const [result, url]: [ResponseToken, string] = await coupleController.createCouple(req.userId!, data, thumbnail);

      logger.debug(`Response Data : ${JSON.stringify(data)}`);
      return res.header({ Location: url }).status(STATUS_CODE.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  };

  if (contentType === "form-data") {
    form.parse(req, async (err, fields, files) => {
      try {
        if (err) throw new InternalServerError(`Image Server Error : ${JSON.stringify(err)}`);
        else if (Array.isArray(files.thumbnail)) throw new BadRequestError("You must request only one thumbnail.");
        req.body = Object.assign({}, req.body, fields);

        createFunc(req, files.thumbnail);
      } catch (error) {
        next(error);
      }
    });
  } else if (contentType === "json") {
    createFunc(req, undefined);
  }
});

// 커플 정보 수정
router.patch("/:cup_id", async (req: Request, res: Response, next: NextFunction) => {
  const contentType: ContentType = req.contentType;
  const form = formidable({ multiples: false, maxFileSize: MAX_FILE_SIZE });

  const updateFunc = async (req: Request, thumbnail?: File | null) => {
    try {
      const { value, error }: ValidationResult = validator(req.body, updateSchema);
      if (error) throw new BadRequestError(error.message);
      else if (req.cupId !== req.params.cup_id) throw new ForbiddenError("You don't same token couple ID and path parameter couple ID");

      const data: UpdateCouple = {
        cupDay: value.cupDay
      };

      const couple: Couple = await coupleController.updateCouple(req.userId!, req.cupId, data, thumbnail);

      return res.status(STATUS_CODE.OK).json(couple);
    } catch (error) {
      next(error);
    }
  };

  if (contentType === "form-data") {
    form.parse(req, async (err, fields, files) => {
      try {
        if (err) throw new InternalServerError(`Image Server Error : ${JSON.stringify(err)}`);
        else if (!files.thumbnail || Array.isArray(files.thumbnail)) throw new BadRequestError("You must request only one thumbnail.");

        req.body = Object.assign({}, req.body, fields);

        updateFunc(req, files.thumbnail);
      } catch (error) {
        next(error);
      }
    });
  } else if (contentType === "json") {
    let thumbnail: null | undefined = undefined;

    if (req.body.thumbnail === "null" || req.body.thumbnail === null) {
      thumbnail = null;
    }

    updateFunc(req, thumbnail);
  }
});

// 커플 끊기
router.delete("/:cup_id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cupId = req.cupId;

    if (!cupId) throw new UnauthorizedError("Invalid Token");
    else if (req.cupId !== req.params.cup_id) throw new ForbiddenError("You don't same token couple ID and path parameter couple ID");

    const result: ResponseToken = await coupleController.deleteCouple(req.userId!, req.roleId!, cupId);

    logger.debug(`Response Data : ${JSON.stringify(result)}`);
    return res.status(STATUS_CODE.OK).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
