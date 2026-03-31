"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info(message, meta) {
        console.log(message, meta || '');
    },
    error(message, meta) {
        console.error(message, meta || '');
    },
};
