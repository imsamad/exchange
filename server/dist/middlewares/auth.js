"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const CustomError_1 = require("../libs/CustomError");
const authMiddleware = (req, res, next) => {
    var _a, _b, _c, _d;
    let authSession = "";
    if ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith("Bearer "))
        authSession = (_d = (_c = (_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split) === null || _c === void 0 ? void 0 : _c.call(_b, " ")) === null || _d === void 0 ? void 0 : _d[1];
    if (!authSession)
        throw new CustomError_1.CustomeError(404, {
            message: "not authorised",
        });
    try {
        const payload = jsonwebtoken_1.default.verify(authSession, process.env.JWT_SECRET);
        if (!payload.id)
            throw new CustomError_1.CustomeError(404, "not authorised!");
        req.currentUser = payload.id
            ? { id: payload.id, isAdmin: payload.role == "admin" }
            : undefined;
        next();
    }
    catch (error) {
        throw new CustomError_1.CustomeError(404, {
            message: "not authorised",
        });
    }
};
exports.authMiddleware = authMiddleware;
