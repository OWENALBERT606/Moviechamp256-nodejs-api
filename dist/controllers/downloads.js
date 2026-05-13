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
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDownloadLimit = checkDownloadLimit;
exports.recordDownload = recordDownload;
const db_1 = require("../db/db");
function checkDownloadLimit(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ data: null, error: "Unauthorized" });
        }
        try {
            const user = yield db_1.db.user.findUnique({
                where: { id: userId },
                select: {
                    currentPlan: true,
                    planExpiresAt: true,
                    isExempt: true,
                },
            });
            if (!user) {
                return res.status(404).json({ data: null, error: "User not found" });
            }
            const isPaidPlan = user.currentPlan && user.planExpiresAt && user.planExpiresAt > new Date();
            if (user.isExempt || isPaidPlan) {
                return res.status(200).json({ data: { canDownload: true }, error: null });
            }
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const downloadCount = yield db_1.db.downloadEvent.count({
                where: {
                    userId,
                    createdAt: {
                        gte: twentyFourHoursAgo,
                    },
                },
            });
            const canDownload = downloadCount < 2;
            return res.status(200).json({
                data: {
                    canDownload,
                    remainingDownloads: Math.max(0, 2 - downloadCount),
                    limit: 2,
                },
                error: null,
            });
        }
        catch (error) {
            console.error("Error checking download limit:", error);
            return res.status(500).json({ data: null, error: "Failed to check download limit" });
        }
    });
}
function recordDownload(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { movieId, seriesId, episodeId, docId } = req.body;
        if (!userId) {
            return res.status(401).json({ data: null, error: "Unauthorized" });
        }
        try {
            const event = yield db_1.db.downloadEvent.create({
                data: {
                    userId,
                    movieId: movieId || null,
                    seriesId: seriesId || null,
                    episodeId: episodeId || null,
                    docId: docId || null,
                },
            });
            return res.status(201).json({ data: event, error: null });
        }
        catch (error) {
            console.error("Error recording download:", error);
            return res.status(500).json({ data: null, error: "Failed to record download" });
        }
    });
}
