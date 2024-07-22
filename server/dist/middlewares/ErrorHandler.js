"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
const CustomError_1 = require("../libs/CustomError");
const ErrorHandler = (err, _req, res, _next) => {
    console.log(err);
    if (err instanceof CustomError_1.CustomeError)
        return res.status(err.statusCode).json({
            message: err.msg,
        });
    return res.status(500).json({
        message: "Server is under maintenance!",
    });
};
exports.ErrorHandler = ErrorHandler;
