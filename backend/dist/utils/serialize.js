"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeData = serializeData;
function serializeData(value) {
    if (value === null || value === undefined) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(serializeData);
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        if ('toJSON' in value && typeof value.toJSON === 'function') {
            return serializeData(value.toJSON());
        }
        return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [
            key,
            serializeData(nestedValue),
        ]));
    }
    return value;
}
