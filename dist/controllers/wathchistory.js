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
exports.updateWatchProgress = updateWatchProgress;
exports.getWatchHistory = getWatchHistory;
exports.getContinueWatching = getContinueWatching;
exports.getWatchProgress = getWatchProgress;
exports.deleteWatchHistoryItem = deleteWatchHistoryItem;
exports.clearWatchHistory = clearWatchHistory;
const db_1 = require("../db/db");
function serializeBigInt(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) => typeof value === "bigint" ? value.toString() : value));
}
function updateWatchProgress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, movieId, seriesId, episodeId, currentTime, duration } = req.body;
        try {
            if (!userId) {
                return res.status(400).json({ data: null, error: "User ID is required" });
            }
            if (!movieId && !episodeId) {
                return res.status(400).json({
                    data: null,
                    error: "Either movieId or episodeId is required",
                });
            }
            if (currentTime === undefined || duration === undefined) {
                return res.status(400).json({
                    data: null,
                    error: "currentTime and duration are required",
                });
            }
            const progressPercent = (currentTime / duration) * 100;
            const completed = progressPercent >= 90;
            if (movieId) {
                const watchHistory = yield db_1.db.watchHistory.upsert({
                    where: {
                        userId_movieId: {
                            userId,
                            movieId,
                        },
                    },
                    update: {
                        currentTime,
                        duration,
                        progressPercent,
                        completed,
                        lastWatchedAt: new Date(),
                    },
                    create: {
                        userId,
                        movieId,
                        currentTime,
                        duration,
                        progressPercent,
                        completed,
                    },
                    include: {
                        movie: {
                            include: {
                                vj: true,
                                genre: true,
                                year: true,
                            },
                        },
                    },
                });
                return res.status(200).json({
                    data: serializeBigInt(watchHistory),
                    error: null,
                });
            }
            if (episodeId) {
                const watchHistory = yield db_1.db.watchHistory.upsert({
                    where: {
                        userId_episodeId: {
                            userId,
                            episodeId,
                        },
                    },
                    update: {
                        currentTime,
                        duration,
                        progressPercent,
                        completed,
                        seriesId: seriesId || undefined,
                        lastWatchedAt: new Date(),
                    },
                    create: {
                        userId,
                        episodeId,
                        seriesId: seriesId || undefined,
                        currentTime,
                        duration,
                        progressPercent,
                        completed,
                    },
                    include: {
                        episode: {
                            include: {
                                season: {
                                    include: {
                                        series: {
                                            include: {
                                                vj: true,
                                                genre: true,
                                                year: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
                return res.status(200).json({
                    data: serializeBigInt(watchHistory),
                    error: null,
                });
            }
        }
        catch (error) {
            console.error("Error updating watch progress:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to update watch progress",
            });
        }
    });
}
function getWatchHistory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const { type, limit = 20 } = req.query;
        try {
            if (!userId) {
                return res.status(400).json({ data: null, error: "User ID is required" });
            }
            const where = { userId };
            if (type === "movies") {
                where.movieId = { not: null };
            }
            else if (type === "series") {
                where.episodeId = { not: null };
            }
            const watchHistory = yield db_1.db.watchHistory.findMany({
                where,
                orderBy: { lastWatchedAt: "desc" },
                take: Number(limit),
                include: {
                    movie: {
                        include: {
                            vj: true,
                            genre: true,
                            year: true,
                        },
                    },
                    episode: {
                        include: {
                            season: {
                                include: {
                                    series: {
                                        include: {
                                            vj: true,
                                            genre: true,
                                            year: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    series: {
                        include: {
                            vj: true,
                            genre: true,
                            year: true,
                        },
                    },
                },
            });
            return res.status(200).json({
                data: serializeBigInt(watchHistory),
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching watch history:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch watch history",
            });
        }
    });
}
function getContinueWatching(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const { limit = 10 } = req.query;
        try {
            if (!userId) {
                return res.status(400).json({ data: null, error: "User ID is required" });
            }
            const continueWatching = yield db_1.db.watchHistory.findMany({
                where: {
                    userId,
                    completed: false,
                    progressPercent: {
                        gte: 5,
                    },
                },
                orderBy: { lastWatchedAt: "desc" },
                take: Number(limit),
                include: {
                    movie: {
                        include: {
                            vj: true,
                            genre: true,
                            year: true,
                        },
                    },
                    episode: {
                        include: {
                            season: {
                                include: {
                                    series: {
                                        include: {
                                            vj: true,
                                            genre: true,
                                            year: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    series: {
                        include: {
                            vj: true,
                            genre: true,
                            year: true,
                        },
                    },
                },
            });
            return res.status(200).json({
                data: serializeBigInt(continueWatching),
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching continue watching:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch continue watching",
            });
        }
    });
}
function getWatchProgress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, movieId, episodeId } = req.query;
        try {
            if (!userId) {
                return res.status(400).json({ data: null, error: "User ID is required" });
            }
            if (!movieId && !episodeId) {
                return res.status(400).json({
                    data: null,
                    error: "Either movieId or episodeId is required",
                });
            }
            let watchHistory = null;
            if (movieId) {
                watchHistory = yield db_1.db.watchHistory.findUnique({
                    where: {
                        userId_movieId: {
                            userId: userId,
                            movieId: movieId,
                        },
                    },
                });
            }
            if (episodeId) {
                watchHistory = yield db_1.db.watchHistory.findUnique({
                    where: {
                        userId_episodeId: {
                            userId: userId,
                            episodeId: episodeId,
                        },
                    },
                });
            }
            return res.status(200).json({
                data: watchHistory ? serializeBigInt(watchHistory) : null,
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching watch progress:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch watch progress",
            });
        }
    });
}
function deleteWatchHistoryItem(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            yield db_1.db.watchHistory.delete({
                where: { id },
            });
            return res.status(200).json({
                data: null,
                message: "Watch history item deleted",
            });
        }
        catch (error) {
            console.error("Error deleting watch history:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to delete watch history",
            });
        }
    });
}
function clearWatchHistory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        try {
            yield db_1.db.watchHistory.deleteMany({
                where: { userId },
            });
            return res.status(200).json({
                data: null,
                message: "Watch history cleared",
            });
        }
        catch (error) {
            console.error("Error clearing watch history:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to clear watch history",
            });
        }
    });
}
