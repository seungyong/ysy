import dayjs from "dayjs";
import express, { Router, Request, Response, NextFunction } from "express";

import { ITouristSpotResponseWithCount, PageOptions as CulPageOptions, SearchOptions as CulSearchOptions } from "../model/touristSpot.model";

import touristSpotAdminController from "../controller/touristSpot.admin.controller";

import logger from "../logger/logger";
import { STATUS_CODE } from "../constant/statusCode.constant";
import { canView } from "../util/checkRole.util";

dayjs.locale("ko");

const router: Router = express.Router();

// let url = "https://apis.data.go.kr/B551011/KorService1/areaBasedList1?numOfRows=";

router.get("/", canView, async (req: Request, res: Response, next: NextFunction) => {
    const pageOptions: CulPageOptions = {
        numOfRows: Number(req.query.count) || 10,
        page: Number(req.query.page) || 1
    };
    const searchOptions: CulSearchOptions = {
        contentTypeId: String(req.query.contentTypeId) || undefined
    };
    try {
        const result: ITouristSpotResponseWithCount = await touristSpotAdminController.getTouristSpotFromAPI(pageOptions, searchOptions);

        logger.debug(`Response Data => ${JSON.stringify(result)}`);
        return res.status(STATUS_CODE.OK).json(result);
    } catch (error) {
        next(error);
    }
});

router.post("/create", canView, async (req: Request, res: Response, next: NextFunction) => {
    const pageOptions: CulPageOptions = {
        numOfRows: Number(req.query.numOfRows) || 10,
        page: Number(req.query.page) || 1
    };
    const searchOptions: CulSearchOptions = {
        contentTypeId: String(req.query.contentTypeId) || undefined
    };
    try {
        const result: ITouristSpotResponseWithCount = await touristSpotAdminController.createTouristSpotDB(pageOptions, searchOptions);

        logger.debug(`Response Data => ${JSON.stringify(result)}`);
        return res.status(STATUS_CODE.OK).json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
