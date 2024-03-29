import { NextFunction, Request, Response } from "express";
import ForbiddenError from "../errors/forbidden.error.js";

export const canModifyWithAdmin = (req: Request, _res: Response, next: NextFunction) => {
  const role: number = Number(req.roleId);

  if (role !== 1) throw new ForbiddenError("Unauthorized Access");
  else next();
};

export const canModifyWithEditor = (req: Request, _res: Response, next: NextFunction) => {
  const role: number = Number(req.roleId);

  if (role !== 1 && role !== 2) throw new ForbiddenError("Unauthorized Access");
  else next();
};

export const canView = (req: Request, _res: Response, next: NextFunction) => {
  const role: number = Number(req.roleId);

  if (role !== 1 && role !== 2 && role !== 3) throw new ForbiddenError("Unauthorized Access");
  else next();
};
