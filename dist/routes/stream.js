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
const express_1 = require("express");
const db_1 = require("../db/db");
const signed_url_1 = require("../utils/signed-url");
const r2_delete_1 = require("../services/r2-delete");
const cache_1 = require("../utils/cache");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const streamRouter = (0, express_1.Router)();
const optionalAuthenticate = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return next();
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (!err && decoded) {
            req.user = decoded;
        }
        next();
    });
};
streamRouter.get("/stream/:movieId", optionalAuthenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { movieId } = req.params;
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || "guest";
    try {
        const movie = yield (0, cache_1.withCache)(`movie:${movieId}`, 3600, () => db_1.db.movie.findUnique({
            where: { id: movieId },
            select: { videoUrl: true },
        }));
        if (!movie) {
            return res.status(404).json({ data: null, error: "Movie not found" });
        }
        if (!movie.videoUrl) {
            return res.status(404).json({ data: null, error: "No video available for this movie" });
        }
        const key = (0, r2_delete_1.extractR2Key)(movie.videoUrl);
        if (!key) {
            return res.status(500).json({ data: null, error: "Could not resolve video path" });
        }
        const url = yield (0, cache_1.withCache)(`stream-url:${userId}:${movieId}`, 3000, () => __awaiter(void 0, void 0, void 0, function* () { return (0, signed_url_1.generateSignedUrl)(key); }));
        return res.json({ data: { url }, error: null });
    }
    catch (error) {
        console.error("Error generating stream URL:", error);
        return res.status(500).json({ data: null, error: "Failed to generate stream URL" });
    }
}));
exports.default = streamRouter;
