"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withCache = withCache;
exports.invalidateCache = invalidateCache;
exports.invalidatePattern = invalidatePattern;
const redis_1 = __importDefault(require("../db/redis"));
function withCache(key, ttlSeconds, fetchFn) {
    return __awaiter(this, void 0, void 0, function* () {
        let cached = null;
        try {
            cached = yield redis_1.default.get(key);
        }
        catch (err) {
            console.error("[cache] Redis GET failed, falling back to DB:", err.message);
            return fetchFn();
        }
        if (cached !== null) {
            try {
                return JSON.parse(cached);
            }
            catch (_a) {
            }
        }
        const fresh = yield fetchFn();
        if (fresh !== null && fresh !== undefined) {
            redis_1.default
                .setex(key, ttlSeconds, JSON.stringify(fresh))
                .catch((err) => console.error("[cache] Redis SET failed (non-fatal):", err.message));
        }
        return fresh;
    });
}
function invalidateCache(key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield redis_1.default.del(key);
        }
        catch (err) {
            console.error("[cache] Failed to invalidate key:", key, err.message);
        }
    });
}
function invalidatePattern(pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const keys = yield redis_1.default.keys(pattern);
            if (keys.length > 0)
                yield redis_1.default.del(...keys);
        }
        catch (err) {
            console.error("[cache] Failed to invalidate pattern:", pattern, err.message);
        }
    });
}
