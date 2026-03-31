"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeResponse = serializeResponse;
const serialize_1 = require("../utils/serialize");
function serializeResponse(_req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = ((payload) => originalJson((0, serialize_1.serializeData)(payload)));
    next();
}
