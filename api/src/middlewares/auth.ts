import jwt from "jsonwebtoken";

import { NextFunction, Request, Response } from "express";
import { CustomeError } from "../libs/CustomError";
interface UserPayload {
  id: string;
  isAdmin: boolean;
}
declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let authSession = "";

  if (req.headers.authorization?.startsWith("Bearer "))
    authSession = req.headers.authorization?.split?.(" ")?.[1];

  if (!authSession)
    throw new CustomeError(404, {
      message: "not authorised",
    });
  try {
    const payload: any = jwt.verify(authSession, process.env.JWT_SECRET!);

    if (!payload.id) throw new CustomeError(404, "not authorised!");

    req.currentUser = payload.id
      ? { id: payload.id, isAdmin: payload.role == "admin" }
      : undefined;
    next();
  } catch (error) {
    throw new CustomeError(404, {
      message: "not authorised",
    });
  }
};
