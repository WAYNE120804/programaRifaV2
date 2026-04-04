"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const node_crypto_1 = require("node:crypto");
const KEY_LENGTH = 64;
function hashPassword(password) {
    const salt = (0, node_crypto_1.randomBytes)(16).toString('hex');
    const hash = (0, node_crypto_1.scryptSync)(password, salt, KEY_LENGTH).toString('hex');
    return `${salt}:${hash}`;
}
function verifyPassword(password, storedHash) {
    const [salt, originalHash] = String(storedHash || '').split(':');
    if (!salt || !originalHash) {
        return false;
    }
    const computedHash = (0, node_crypto_1.scryptSync)(password, salt, KEY_LENGTH);
    const originalBuffer = Buffer.from(originalHash, 'hex');
    if (computedHash.length !== originalBuffer.length) {
        return false;
    }
    return (0, node_crypto_1.timingSafeEqual)(computedHash, originalBuffer);
}
