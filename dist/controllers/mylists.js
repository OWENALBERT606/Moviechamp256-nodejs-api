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
exports.addToMyList = addToMyList;
exports.removeFromMyList = removeFromMyList;
exports.getMyList = getMyList;
exports.checkInMyList = checkInMyList;
exports.getMyListStats = getMyListStats;
const db_1 = require("../db/db");
function serializeBigInt(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) => typeof value === "bigint" ? value.toString() : value));
}
function getOrCreateList(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        let list = yield db_1.db.myList.findUnique({
            where: { userId },
        });
        if (!list) {
            list = yield db_1.db.myList.create({
                data: { userId },
            });
        }
        return list;
    });
}
function addToMyList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, movieId, seriesId } = req.body;
        try {
            if (!userId) {
                return res.status(400).json({ data: null, error: "User ID is required" });
            }
            if (!movieId && !seriesId) {
                return res.status(400).json({
                    data: null,
                    error: "Either movieId or seriesId is required",
                });
            }
            if (movieId && seriesId) {
                return res.status(400).json({
                    data: null,
                    error: "Cannot add both movie and series at once",
                });
            }
            const list = yield getOrCreateList(userId);
            if (movieId) {
                const movieExists = yield db_1.db.movie.findUnique({
                    where: { id: movieId },
                });
                if (!movieExists) {
                    return res.status(404).json({ data: null, error: "Movie not found" });
                }
                const existing = yield db_1.db.myListMovie.findUnique({
                    where: {
                        listId_movieId: {
                            listId: list.id,
                            movieId,
                        },
                    },
                });
                if (existing) {
                    return res.status(409).json({
                        data: null,
                        error: "Movie is already in your list",
                    });
                }
                const listItem = yield db_1.db.myListMovie.create({
                    data: {
                        listId: list.id,
                        movieId,
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
                console.log(`✅ Added movie to list: User ${userId} - Movie ${movieId}`);
                return res.status(201).json({
                    data: serializeBigInt(listItem),
                    error: null,
                    message: "Movie added to your list",
                });
            }
            if (seriesId) {
                const seriesExists = yield db_1.db.series.findUnique({
                    where: { id: seriesId },
                });
                if (!seriesExists) {
                    return res.status(404).json({ data: null, error: "Series not found" });
                }
                const existing = yield db_1.db.myListSeries.findUnique({
                    where: {
                        listId_seriesId: {
                            listId: list.id,
                            seriesId,
                        },
                    },
                });
                if (existing) {
                    return res.status(409).json({
                        data: null,
                        error: "Series is already in your list",
                    });
                }
                const listItem = yield db_1.db.myListSeries.create({
                    data: {
                        listId: list.id,
                        seriesId,
                    },
                    include: {
                        series: {
                            include: {
                                vj: true,
                                genre: true,
                                year: true,
                            },
                        },
                    },
                });
                console.log(`✅ Added series to list: User ${userId} - Series ${seriesId}`);
                return res.status(201).json({
                    data: serializeBigInt(listItem),
                    error: null,
                    message: "Series added to your list",
                });
            }
        }
        catch (error) {
            console.error("Error adding to my list:", error);
            if (error.code === "P2002") {
                return res.status(409).json({
                    data: null,
                    error: "This item is already in your list",
                });
            }
            return res.status(500).json({
                data: null,
                error: "Failed to add to list",
            });
        }
    });
}
function removeFromMyList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, movieId, seriesId } = req.body;
        try {
            if (!userId) {
                return res.status(400).json({ data: null, error: "User ID is required" });
            }
            if (!movieId && !seriesId) {
                return res.status(400).json({
                    data: null,
                    error: "Either movieId or seriesId is required",
                });
            }
            const list = yield db_1.db.myList.findUnique({
                where: { userId },
            });
            if (!list) {
                return res.status(404).json({
                    data: null,
                    error: "List not found",
                });
            }
            if (movieId) {
                const deleted = yield db_1.db.myListMovie.deleteMany({
                    where: {
                        listId: list.id,
                        movieId,
                    },
                });
                if (deleted.count === 0) {
                    return res.status(404).json({
                        data: null,
                        error: "Movie not found in your list",
                    });
                }
                console.log(`✅ Removed movie from list: User ${userId} - Movie ${movieId}`);
            }
            if (seriesId) {
                const deleted = yield db_1.db.myListSeries.deleteMany({
                    where: {
                        listId: list.id,
                        seriesId,
                    },
                });
                if (deleted.count === 0) {
                    return res.status(404).json({
                        data: null,
                        error: "Series not found in your list",
                    });
                }
                console.log(`✅ Removed series from list: User ${userId} - Series ${seriesId}`);
            }
            return res.status(200).json({
                data: null,
                message: "Removed from your list",
            });
        }
        catch (error) {
            console.error("Error removing from my list:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to remove from list",
            });
        }
    });
}
function getMyList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const { type } = req.query;
        try {
            if (!userId) {
                return res.status(400).json({ data: null, error: "User ID is required" });
            }
            const list = yield getOrCreateList(userId);
            const includeMovies = !type || type === "movies";
            const includeSeries = !type || type === "series";
            const listWithItems = yield db_1.db.myList.findUnique({
                where: { id: list.id },
                include: {
                    movies: includeMovies
                        ? {
                            include: {
                                movie: {
                                    include: {
                                        vj: true,
                                        genre: true,
                                        year: true,
                                    },
                                },
                            },
                            orderBy: { addedAt: "desc" },
                        }
                        : false,
                    series: includeSeries
                        ? {
                            include: {
                                series: {
                                    include: {
                                        vj: true,
                                        genre: true,
                                        year: true,
                                    },
                                },
                            },
                            orderBy: { addedAt: "desc" },
                        }
                        : false,
                },
            });
            return res.status(200).json({
                data: serializeBigInt(listWithItems),
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching my list:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch list" });
        }
    });
}
function checkInMyList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, movieId, seriesId } = req.query;
        try {
            if (!userId) {
                return res.status(400).json({ data: null, error: "User ID is required" });
            }
            const list = yield db_1.db.myList.findUnique({
                where: { userId: userId },
            });
            if (!list) {
                return res.status(200).json({
                    data: { inList: false },
                    error: null,
                });
            }
            let inList = false;
            if (movieId) {
                const item = yield db_1.db.myListMovie.findUnique({
                    where: {
                        listId_movieId: {
                            listId: list.id,
                            movieId: movieId,
                        },
                    },
                });
                inList = !!item;
            }
            if (seriesId) {
                const item = yield db_1.db.myListSeries.findUnique({
                    where: {
                        listId_seriesId: {
                            listId: list.id,
                            seriesId: seriesId,
                        },
                    },
                });
                inList = !!item;
            }
            return res.status(200).json({
                data: { inList },
                error: null,
            });
        }
        catch (error) {
            console.error("Error checking my list:", error);
            return res.status(500).json({ data: null, error: "Failed to check list" });
        }
    });
}
function getMyListStats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        try {
            if (!userId) {
                return res.status(400).json({ data: null, error: "User ID is required" });
            }
            const list = yield getOrCreateList(userId);
            const [totalMovies, totalSeries] = yield Promise.all([
                db_1.db.myListMovie.count({
                    where: { listId: list.id },
                }),
                db_1.db.myListSeries.count({
                    where: { listId: list.id },
                }),
            ]);
            return res.status(200).json({
                data: {
                    totalMovies,
                    totalSeries,
                    total: totalMovies + totalSeries,
                },
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching my list stats:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch stats" });
        }
    });
}
