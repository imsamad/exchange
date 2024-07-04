import { Request, Response, NextFunction } from 'express';
import { CustomeError } from '../libs/CustomError';

export const ErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof CustomeError)
    return res.status(err.statusCode).json({
      message: err.msg,
    });

  return res.status(500).json({
    message: 'Server is under maintenance!',
  });
};
