"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthToken = createAuthToken;
exports.verifyAuthToken = verifyAuthToken;
const node_crypto_1 = require("node:crypto");
const env_1 = require("../config/env");
function toBase64Url(value) {
    return Buffer.from(value, 'utf8').toString('base64url');
}
function fromBase64Url(value) {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}
function signSegment(value) {
    return (0, node_crypto_1.createHmac)('sha256', env_1.env.authSecret).update(value).digest('base64url');
}
function createAuthToken(input) {
    const payload = {
        ...input,
        exp: Math.floor(Date.now() / 1000) + env_1.env.authTtlSeconds,
    };
    const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = toBase64Url(JSON.stringify(payload));
    const signature = signSegment(`${header}.${body}`);
    return `${header}.${body}.${signature}`;
}
function verifyAuthToken(token) {
    const [header, body, signature] = String(token || '').split('.');
    if (!header || !body || !signature) {
        return null;
    }
    const expected = signSegment(`${header}.${body}`);
    if (expected.length !== signature.length) {
        return null;
    }
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');
    if (!(0, node_crypto_1.timingSafeEqual)(expectedBuffer, signatureBuffer)) {
        return null;
    }
    const payload = fromBase64Url(body);
    if (!payload?.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
    }
    return payload;
}
