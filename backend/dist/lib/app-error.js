"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    errorCode;
    details;
    constructor(message, statusCode = 400, options) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.errorCode = options?.errorCode;
        this.details = options?.details;
    }
}
exports.AppError = AppError;
