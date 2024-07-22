"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomeError = void 0;
class CustomeError extends Error {
    constructor(statusCode, msg) {
        super('Hello from custom error');
        this.statusCode = statusCode;
        this.msg = msg;
    }
}
exports.CustomeError = CustomeError;
