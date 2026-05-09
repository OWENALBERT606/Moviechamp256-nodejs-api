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
exports.createSeries = createSeries;
exports.getAllSeries = getAllSeries;
exports.getSeriesById = getSeriesById;
exports.getSeriesBySlug = getSeriesBySlug;
exports.updateSeries = updateSeries;
exports.deleteSeries = deleteSeries;
exports.incrementSeriesViewCount = incrementSeriesViewCount;
exports.getTrendingSeries = getTrendingSeries;
exports.getComingSoonSeries = getComingSoonSeries;
exports.createSeason = createSeason;
exports.getSeasonsBySeriesId = getSeasonsBySeriesId;
exports.getSeasonById = getSeasonById;
exports.updateSeason = updateSeason;
exports.deleteSeason = deleteSeason;
exports.createEpisode = createEpisode;
exports.getEpisodesBySeasonId = getEpisodesBySeasonId;
exports.getEpisodeById = getEpisodeById;
exports.updateEpisode = updateEpisode;
exports.deleteEpisode = deleteEpisode;
exports.incrementEpisodeViewCount = incrementEpisodeViewCount;
exports.getNextEpisode = getNextEpisode;
exports.getPreviousEpisode = getPreviousEpisode;
exports.addSeasonsToSeries = addSeasonsToSeries;
const db_1 = require("../db/db");
const r2_delete_1 = require("../services/r2-delete");
BigInt.prototype.toJSON = function () {
    return this.toString();
};
function serializeBigInt(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) => typeof value === "bigint" ? value.toString() : value));
}
function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function createSeries(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { title, poster, trailerPoster, rating, vjId, genreId, yearId, description, director, cast, trailerUrl, isComingSoon, isTrending, seasons, } = req.body;
        try {
            if (!title || !title.trim()) {
                return res.status(400).json({ data: null, error: "Series title is required" });
            }
            if (!vjId || !genreId || !yearId) {
                return res.status(400).json({ data: null, error: "VJ, Genre, and Year are required" });
            }
            const titleNorm = title.trim();
            const slug = generateSlug(titleNorm);
            const existingSeries = yield db_1.db.series.findUnique({
                where: { slug },
                select: { id: true },
            });
            if (existingSeries) {
                return res.status(409).json({
                    data: null,
                    error: "Series with this title already exists",
                });
            }
            const totalSeasons = Array.isArray(seasons) ? seasons.length : 0;
            const totalEpisodes = Array.isArray(seasons)
                ? seasons.reduce((sum, s) => sum + (Array.isArray(s.episodes) ? s.episodes.length : 0), 0)
                : 0;
            const newSeries = yield db_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const series = yield tx.series.create({
                    data: {
                        title: titleNorm,
                        slug,
                        poster: poster || "",
                        trailerPoster: trailerPoster || "",
                        rating: parseFloat(rating) || 0,
                        vjId,
                        genreId,
                        yearId,
                        description: (description === null || description === void 0 ? void 0 : description.trim()) || "",
                        director: (director === null || director === void 0 ? void 0 : director.trim()) || "",
                        cast: Array.isArray(cast) ? cast : [],
                        trailerUrl: trailerUrl || "",
                        isComingSoon: isComingSoon === true || isComingSoon === "true",
                        isTrending: isTrending === true || isTrending === "true",
                        totalSeasons,
                        totalEpisodes,
                    },
                });
                if (Array.isArray(seasons) && seasons.length > 0) {
                    for (const seasonData of seasons) {
                        const { seasonNumber, title: seasonTitle, description: seasonDesc, poster: seasonPoster, releaseYear, episodes } = seasonData;
                        const season = yield tx.season.create({
                            data: {
                                seriesId: series.id,
                                seasonNumber,
                                title: seasonTitle || `Season ${seasonNumber}`,
                                description: seasonDesc || "",
                                poster: seasonPoster || "",
                                releaseYear: releaseYear || null,
                                totalEpisodes: Array.isArray(episodes) ? episodes.length : 0,
                            },
                        });
                        if (Array.isArray(episodes) && episodes.length > 0) {
                            for (const ep of episodes) {
                                yield tx.episode.create({
                                    data: {
                                        seasonId: season.id,
                                        episodeNumber: ep.episodeNumber,
                                        title: ep.title || `Episode ${ep.episodeNumber}`,
                                        description: ep.description || "",
                                        videoUrl: ep.videoUrl || "",
                                        poster: ep.poster || "",
                                        length: ep.length || "",
                                        lengthSeconds: ep.lengthSeconds || null,
                                        releaseDate: ep.releaseDate ? new Date(ep.releaseDate) : null,
                                    },
                                });
                            }
                        }
                    }
                }
                return series;
            }));
            const seriesWithRelations = yield db_1.db.series.findUnique({
                where: { id: newSeries.id },
                include: {
                    vj: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                        },
                    },
                    genre: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    year: {
                        select: {
                            id: true,
                            value: true,
                        },
                    },
                    seasons: {
                        orderBy: { seasonNumber: "asc" },
                        include: {
                            episodes: {
                                orderBy: { episodeNumber: "asc" },
                                select: {
                                    id: true,
                                    episodeNumber: true,
                                    title: true,
                                    videoUrl: true,
                                },
                            },
                        },
                    },
                },
            });
            return res.status(201).json({ data: serializeBigInt(seriesWithRelations), error: null });
        }
        catch (error) {
            console.error("Error creating series:", error);
            return res.status(500).json({ data: null, error: "Failed to create series" });
        }
    });
}
function getAllSeries(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { page = "1", limit = "20", genreId, vjId, yearId, isTrending, isComingSoon, search, } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const where = {};
            if (genreId)
                where.genreId = genreId;
            if (vjId)
                where.vjId = vjId;
            if (yearId)
                where.yearId = yearId;
            if (isTrending)
                where.isTrending = isTrending === "true";
            if (isComingSoon)
                where.isComingSoon = isComingSoon === "true";
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                    { director: { contains: search, mode: "insensitive" } },
                ];
            }
            const [series, total] = yield Promise.all([
                db_1.db.series.findMany({
                    where,
                    skip,
                    take: limitNum,
                    orderBy: { createdAt: "desc" },
                    include: {
                        vj: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                        genre: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                        year: {
                            select: {
                                id: true,
                                value: true,
                            },
                        },
                        _count: {
                            select: {
                                seasons: true,
                            },
                        },
                    },
                }),
                db_1.db.series.count({ where }),
            ]);
            return res.status(200).json({
                data: serializeBigInt(series),
                error: null,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            });
        }
        catch (error) {
            console.error("Error fetching series:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch series" });
        }
    });
}
function getSeriesById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const series = yield db_1.db.series.findUnique({
                where: { id },
                include: {
                    vj: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                            bio: true,
                        },
                    },
                    genre: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            description: true,
                        },
                    },
                    year: {
                        select: {
                            id: true,
                            value: true,
                        },
                    },
                    seasons: {
                        include: {
                            _count: {
                                select: {
                                    episodes: true,
                                },
                            },
                        },
                        orderBy: {
                            seasonNumber: "asc",
                        },
                    },
                },
            });
            if (!series) {
                return res.status(404).json({ data: null, error: "Series not found" });
            }
            return res.status(200).json({ data: serializeBigInt(series), error: null });
        }
        catch (error) {
            console.error("Error fetching series by id:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function getSeriesBySlug(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const { slug } = req.params;
        console.log("Backend: Looking for series with slug:", slug);
        try {
            const series = yield db_1.db.series.findUnique({
                where: { slug },
                include: {
                    vj: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                            bio: true,
                        },
                    },
                    genre: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            description: true,
                        },
                    },
                    year: {
                        select: {
                            id: true,
                            value: true,
                        },
                    },
                    seasons: {
                        include: {
                            episodes: {
                                orderBy: {
                                    episodeNumber: "asc",
                                },
                            },
                            _count: {
                                select: {
                                    episodes: true,
                                },
                            },
                        },
                        orderBy: {
                            seasonNumber: "asc",
                        },
                    },
                },
            });
            if (!series) {
                console.log("Backend: Series not found with slug:", slug);
                return res.status(404).json({ data: null, error: "Series not found" });
            }
            console.log("Backend: Found series:", series.title);
            console.log("Backend: Seasons count:", (_a = series.seasons) === null || _a === void 0 ? void 0 : _a.length);
            console.log("Backend: Episodes in first season:", (_d = (_c = (_b = series.seasons) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.episodes) === null || _d === void 0 ? void 0 : _d.length);
            return res.status(200).json({ data: serializeBigInt(series), error: null });
        }
        catch (error) {
            console.error("Error fetching series by slug:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function updateSeries(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { id } = req.params;
        const updateData = req.body;
        try {
            const existingSeries = yield db_1.db.series.findUnique({ where: { id } });
            if (!existingSeries) {
                return res.status(404).json({ data: null, error: "Series not found" });
            }
            let slug = existingSeries.slug;
            if (updateData.title && updateData.title.trim() !== existingSeries.title) {
                const titleNorm = updateData.title.trim();
                slug = generateSlug(titleNorm);
                const conflictSeries = yield db_1.db.series.findFirst({
                    where: {
                        slug,
                        NOT: { id },
                    },
                    select: { id: true },
                });
                if (conflictSeries) {
                    return res.status(409).json({
                        data: null,
                        error: "Series with this title already exists",
                    });
                }
            }
            const data = { slug };
            if (updateData.title)
                data.title = updateData.title.trim();
            if (updateData.poster !== undefined)
                data.poster = updateData.poster;
            if (updateData.trailerPoster !== undefined)
                data.trailerPoster = updateData.trailerPoster;
            if (updateData.rating !== undefined)
                data.rating = parseFloat(updateData.rating);
            if (updateData.vjId)
                data.vjId = updateData.vjId;
            if (updateData.genreId)
                data.genreId = updateData.genreId;
            if (updateData.yearId)
                data.yearId = updateData.yearId;
            if (updateData.description !== undefined)
                data.description = ((_a = updateData.description) === null || _a === void 0 ? void 0 : _a.trim()) || "";
            if (updateData.director !== undefined)
                data.director = ((_b = updateData.director) === null || _b === void 0 ? void 0 : _b.trim()) || "";
            if (updateData.cast !== undefined)
                data.cast = Array.isArray(updateData.cast) ? updateData.cast : [];
            if (updateData.trailerUrl !== undefined)
                data.trailerUrl = updateData.trailerUrl;
            if (updateData.isComingSoon !== undefined)
                data.isComingSoon = updateData.isComingSoon === true || updateData.isComingSoon === "true";
            if (updateData.isTrending !== undefined)
                data.isTrending = updateData.isTrending === true || updateData.isTrending === "true";
            const updatedSeries = yield db_1.db.series.update({
                where: { id },
                data,
                include: {
                    vj: true,
                    genre: true,
                    year: true,
                },
            });
            return res.status(200).json({ data: serializeBigInt(updatedSeries), error: null });
        }
        catch (error) {
            console.error("Error updating series:", error);
            return res.status(500).json({ data: null, error: "Failed to update series" });
        }
    });
}
function deleteSeries(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const existingSeries = yield db_1.db.series.findUnique({
                where: { id },
                select: {
                    id: true,
                    poster: true,
                    trailerPoster: true,
                    seasons: {
                        select: {
                            poster: true,
                            episodes: {
                                select: { videoUrl: true, poster: true },
                            },
                        },
                    },
                },
            });
            if (!existingSeries) {
                return res.status(404).json({ data: null, error: "Series not found" });
            }
            yield db_1.db.series.delete({ where: { id } });
            const episodeFiles = existingSeries.seasons.flatMap((s) => s.episodes.flatMap((e) => [e.videoUrl, e.poster]));
            const seasonPosters = existingSeries.seasons.map((s) => s.poster);
            yield (0, r2_delete_1.deleteR2Files)([
                existingSeries.poster,
                existingSeries.trailerPoster,
                ...seasonPosters,
                ...episodeFiles,
            ]);
            return res.status(200).json({
                data: null,
                message: "Series deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting series:", error);
            return res.status(500).json({ data: null, error: "Failed to delete series" });
        }
    });
}
function incrementSeriesViewCount(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const series = yield db_1.db.series.update({
                where: { id },
                data: {
                    viewsCount: {
                        increment: 1,
                    },
                },
                select: {
                    id: true,
                    viewsCount: true,
                },
            });
            return res.status(200).json({ data: serializeBigInt(series), error: null });
        }
        catch (error) {
            console.error("Error incrementing view count:", error);
            return res.status(500).json({ data: null, error: "Failed to increment view count" });
        }
    });
}
function getTrendingSeries(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { limit = "10" } = req.query;
        try {
            const series = yield db_1.db.series.findMany({
                where: { isTrending: true },
                take: parseInt(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    vj: true,
                    genre: true,
                    year: true,
                },
            });
            return res.status(200).json({ data: serializeBigInt(series), error: null });
        }
        catch (error) {
            console.error("Error fetching trending series:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch trending series" });
        }
    });
}
function getComingSoonSeries(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { limit = "10" } = req.query;
        try {
            const series = yield db_1.db.series.findMany({
                where: { isComingSoon: true },
                take: parseInt(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    vj: true,
                    genre: true,
                    year: true,
                },
            });
            return res.status(200).json({ data: serializeBigInt(series), error: null });
        }
        catch (error) {
            console.error("Error fetching coming soon series:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch coming soon series" });
        }
    });
}
function createSeason(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { seriesId } = req.params;
        const { seasonNumber, title, description, poster, trailerUrl, releaseYear } = req.body;
        try {
            if (!seasonNumber) {
                return res.status(400).json({ data: null, error: "Season number is required" });
            }
            const series = yield db_1.db.series.findUnique({
                where: { id: seriesId },
            });
            if (!series) {
                return res.status(404).json({ data: null, error: "Series not found" });
            }
            const newSeason = yield db_1.db.season.create({
                data: {
                    seriesId,
                    seasonNumber: parseInt(seasonNumber),
                    title: (title === null || title === void 0 ? void 0 : title.trim()) || `Season ${seasonNumber}`,
                    description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
                    poster: poster || null,
                    trailerUrl: trailerUrl || null,
                    releaseYear: releaseYear ? parseInt(releaseYear) : null,
                },
            });
            yield db_1.db.series.update({
                where: { id: seriesId },
                data: {
                    totalSeasons: {
                        increment: 1,
                    },
                },
            });
            return res.status(201).json({ data: serializeBigInt(newSeason), error: null });
        }
        catch (error) {
            console.error("Error creating season:", error);
            return res.status(500).json({ data: null, error: "Failed to create season" });
        }
    });
}
function getSeasonsBySeriesId(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { seriesId } = req.params;
        try {
            const seasons = yield db_1.db.season.findMany({
                where: { seriesId },
                orderBy: { seasonNumber: "asc" },
                include: {
                    _count: {
                        select: {
                            episodes: true,
                        },
                    },
                    series: true
                },
            });
            return res.status(200).json({ data: serializeBigInt(seasons), error: null });
        }
        catch (error) {
            console.error("Error fetching seasons:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch seasons" });
        }
    });
}
function getSeasonById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const season = yield db_1.db.season.findUnique({
                where: { id },
                include: {
                    series: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                        },
                    },
                    episodes: {
                        orderBy: {
                            episodeNumber: "asc",
                        },
                    },
                },
            });
            if (!season) {
                return res.status(404).json({ data: null, error: "Season not found" });
            }
            return res.status(200).json({ data: serializeBigInt(season), error: null });
        }
        catch (error) {
            console.error("Error fetching season:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function updateSeason(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { id } = req.params;
        const updateData = req.body;
        try {
            const existingSeason = yield db_1.db.season.findUnique({ where: { id } });
            if (!existingSeason) {
                return res.status(404).json({ data: null, error: "Season not found" });
            }
            const data = {};
            if (updateData.seasonNumber !== undefined)
                data.seasonNumber = parseInt(updateData.seasonNumber);
            if (updateData.title !== undefined)
                data.title = ((_a = updateData.title) === null || _a === void 0 ? void 0 : _a.trim()) || null;
            if (updateData.description !== undefined)
                data.description = ((_b = updateData.description) === null || _b === void 0 ? void 0 : _b.trim()) || null;
            if (updateData.poster !== undefined)
                data.poster = updateData.poster || null;
            if (updateData.trailerUrl !== undefined)
                data.trailerUrl = updateData.trailerUrl || null;
            if (updateData.releaseYear !== undefined)
                data.releaseYear = updateData.releaseYear ? parseInt(updateData.releaseYear) : null;
            const updatedSeason = yield db_1.db.season.update({
                where: { id },
                data,
            });
            return res.status(200).json({ data: serializeBigInt(updatedSeason), error: null });
        }
        catch (error) {
            console.error("Error updating season:", error);
            return res.status(500).json({ data: null, error: "Failed to update season" });
        }
    });
}
function deleteSeason(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const existingSeason = yield db_1.db.season.findUnique({
                where: { id },
                select: {
                    seriesId: true,
                    poster: true,
                    episodes: {
                        select: { videoUrl: true, poster: true },
                    },
                },
            });
            if (!existingSeason) {
                return res.status(404).json({ data: null, error: "Season not found" });
            }
            const episodeCount = existingSeason.episodes.length;
            yield db_1.db.season.delete({ where: { id } });
            yield db_1.db.series.update({
                where: { id: existingSeason.seriesId },
                data: {
                    totalSeasons: { decrement: 1 },
                    totalEpisodes: { decrement: episodeCount },
                },
            });
            yield (0, r2_delete_1.deleteR2Files)([
                existingSeason.poster,
                ...existingSeason.episodes.flatMap((e) => [e.videoUrl, e.poster]),
            ]);
            return res.status(200).json({
                data: null,
                message: "Season deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting season:", error);
            return res.status(500).json({ data: null, error: "Failed to delete season" });
        }
    });
}
function createEpisode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { seasonId } = req.params;
        const { episodeNumber, title, description, videoUrl, poster, length, lengthSeconds, size, releaseDate, } = req.body;
        try {
            if (!episodeNumber || !title || !videoUrl) {
                return res.status(400).json({
                    data: null,
                    error: "Episode number, title, and video URL are required",
                });
            }
            const season = yield db_1.db.season.findUnique({
                where: { id: seasonId },
                select: { seriesId: true },
            });
            if (!season) {
                return res.status(404).json({ data: null, error: "Season not found" });
            }
            const existingEpisode = yield db_1.db.episode.findFirst({
                where: {
                    seasonId,
                    episodeNumber: parseInt(episodeNumber),
                },
            });
            if (existingEpisode) {
                return res.status(409).json({
                    data: null,
                    error: "Episode with this number already exists in this season",
                });
            }
            const newEpisode = yield db_1.db.episode.create({
                data: {
                    seasonId,
                    episodeNumber: parseInt(episodeNumber),
                    title: title.trim(),
                    description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
                    videoUrl,
                    poster: poster || null,
                    length: length || null,
                    lengthSeconds: lengthSeconds ? parseInt(lengthSeconds) : null,
                    size: size || null,
                    releaseDate: releaseDate ? new Date(releaseDate) : null,
                },
            });
            yield Promise.all([
                db_1.db.season.update({
                    where: { id: seasonId },
                    data: {
                        totalEpisodes: {
                            increment: 1,
                        },
                    },
                }),
                db_1.db.series.update({
                    where: { id: season.seriesId },
                    data: {
                        totalEpisodes: {
                            increment: 1,
                        },
                    },
                }),
            ]);
            return res.status(201).json({ data: serializeBigInt(newEpisode), error: null });
        }
        catch (error) {
            console.error("Error creating episode:", error);
            return res.status(500).json({ data: null, error: "Failed to create episode" });
        }
    });
}
function getEpisodesBySeasonId(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { seasonId } = req.params;
        try {
            const episodes = yield db_1.db.episode.findMany({
                where: { seasonId },
                orderBy: { episodeNumber: "asc" },
            });
            return res.status(200).json({ data: serializeBigInt(episodes), error: null });
        }
        catch (error) {
            console.error("Error fetching episodes:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch episodes" });
        }
    });
}
function getEpisodeById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const episode = yield db_1.db.episode.findUnique({
                where: { id },
                include: {
                    season: {
                        select: {
                            id: true,
                            seasonNumber: true,
                            title: true,
                            seriesId: true,
                            series: {
                                select: {
                                    id: true,
                                    title: true,
                                    slug: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!episode) {
                return res.status(404).json({ data: null, error: "Episode not found" });
            }
            return res.status(200).json({ data: serializeBigInt(episode), error: null });
        }
        catch (error) {
            console.error("Error fetching episode:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function updateEpisode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const updateData = req.body;
        try {
            const existingEpisode = yield db_1.db.episode.findUnique({ where: { id } });
            if (!existingEpisode) {
                return res.status(404).json({ data: null, error: "Episode not found" });
            }
            const data = {};
            if (updateData.episodeNumber !== undefined)
                data.episodeNumber = parseInt(updateData.episodeNumber);
            if (updateData.title !== undefined)
                data.title = updateData.title.trim();
            if (updateData.description !== undefined)
                data.description = ((_a = updateData.description) === null || _a === void 0 ? void 0 : _a.trim()) || null;
            if (updateData.videoUrl !== undefined)
                data.videoUrl = updateData.videoUrl;
            if (updateData.poster !== undefined)
                data.poster = updateData.poster || null;
            if (updateData.length !== undefined)
                data.length = updateData.length || null;
            if (updateData.lengthSeconds !== undefined)
                data.lengthSeconds = updateData.lengthSeconds ? parseInt(updateData.lengthSeconds) : null;
            if (updateData.size !== undefined)
                data.size = updateData.size || null;
            if (updateData.releaseDate !== undefined)
                data.releaseDate = updateData.releaseDate ? new Date(updateData.releaseDate) : null;
            const updatedEpisode = yield db_1.db.episode.update({
                where: { id },
                data,
            });
            return res.status(200).json({ data: serializeBigInt(updatedEpisode), error: null });
        }
        catch (error) {
            console.error("Error updating episode:", error);
            return res.status(500).json({ data: null, error: "Failed to update episode" });
        }
    });
}
function deleteEpisode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const existingEpisode = yield db_1.db.episode.findUnique({
                where: { id },
                select: {
                    seasonId: true,
                    videoUrl: true,
                    poster: true,
                    season: {
                        select: { seriesId: true },
                    },
                },
            });
            if (!existingEpisode) {
                return res.status(404).json({ data: null, error: "Episode not found" });
            }
            yield db_1.db.episode.delete({ where: { id } });
            yield Promise.all([
                db_1.db.season.update({
                    where: { id: existingEpisode.seasonId },
                    data: { totalEpisodes: { decrement: 1 } },
                }),
                db_1.db.series.update({
                    where: { id: existingEpisode.season.seriesId },
                    data: { totalEpisodes: { decrement: 1 } },
                }),
            ]);
            yield (0, r2_delete_1.deleteR2Files)([existingEpisode.videoUrl, existingEpisode.poster]);
            return res.status(200).json({
                data: null,
                message: "Episode deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting episode:", error);
            return res.status(500).json({ data: null, error: "Failed to delete episode" });
        }
    });
}
function incrementEpisodeViewCount(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const episode = yield db_1.db.episode.update({
                where: { id },
                data: {
                    viewsCount: {
                        increment: 1,
                    },
                },
                select: {
                    id: true,
                    viewsCount: true,
                    season: {
                        select: {
                            seriesId: true,
                        },
                    },
                },
            });
            yield db_1.db.series.update({
                where: { id: episode.season.seriesId },
                data: {
                    viewsCount: {
                        increment: 1,
                    },
                },
            });
            return res.status(200).json({ data: serializeBigInt(episode), error: null });
        }
        catch (error) {
            console.error("Error incrementing episode view count:", error);
            return res.status(500).json({ data: null, error: "Failed to increment view count" });
        }
    });
}
function getNextEpisode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const currentEpisode = yield db_1.db.episode.findUnique({
                where: { id },
                select: {
                    seasonId: true,
                    episodeNumber: true,
                    season: {
                        select: {
                            seriesId: true,
                            seasonNumber: true,
                        },
                    },
                },
            });
            if (!currentEpisode) {
                return res.status(404).json({ data: null, error: "Episode not found" });
            }
            let nextEpisode = yield db_1.db.episode.findFirst({
                where: {
                    seasonId: currentEpisode.seasonId,
                    episodeNumber: {
                        gt: currentEpisode.episodeNumber,
                    },
                },
                orderBy: {
                    episodeNumber: "asc",
                },
            });
            if (!nextEpisode) {
                const nextSeason = yield db_1.db.season.findFirst({
                    where: {
                        seriesId: currentEpisode.season.seriesId,
                        seasonNumber: {
                            gt: currentEpisode.season.seasonNumber,
                        },
                    },
                    orderBy: {
                        seasonNumber: "asc",
                    },
                });
                if (nextSeason) {
                    nextEpisode = yield db_1.db.episode.findFirst({
                        where: {
                            seasonId: nextSeason.id,
                        },
                        orderBy: {
                            episodeNumber: "asc",
                        },
                    });
                }
            }
            if (!nextEpisode) {
                return res.status(404).json({ data: null, error: "No next episode found" });
            }
            return res.status(200).json({ data: serializeBigInt(nextEpisode), error: null });
        }
        catch (error) {
            console.error("Error fetching next episode:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch next episode" });
        }
    });
}
function getPreviousEpisode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const currentEpisode = yield db_1.db.episode.findUnique({
                where: { id },
                select: {
                    seasonId: true,
                    episodeNumber: true,
                    season: {
                        select: {
                            seriesId: true,
                            seasonNumber: true,
                        },
                    },
                },
            });
            if (!currentEpisode) {
                return res.status(404).json({ data: null, error: "Episode not found" });
            }
            let previousEpisode = yield db_1.db.episode.findFirst({
                where: {
                    seasonId: currentEpisode.seasonId,
                    episodeNumber: {
                        lt: currentEpisode.episodeNumber,
                    },
                },
                orderBy: {
                    episodeNumber: "desc",
                },
            });
            if (!previousEpisode) {
                const previousSeason = yield db_1.db.season.findFirst({
                    where: {
                        seriesId: currentEpisode.season.seriesId,
                        seasonNumber: {
                            lt: currentEpisode.season.seasonNumber,
                        },
                    },
                    orderBy: {
                        seasonNumber: "desc",
                    },
                });
                if (previousSeason) {
                    previousEpisode = yield db_1.db.episode.findFirst({
                        where: {
                            seasonId: previousSeason.id,
                        },
                        orderBy: {
                            episodeNumber: "desc",
                        },
                    });
                }
            }
            if (!previousEpisode) {
                return res.status(404).json({ data: null, error: "No previous episode found" });
            }
            return res.status(200).json({ data: serializeBigInt(previousEpisode), error: null });
        }
        catch (error) {
            console.error("Error fetching previous episode:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch previous episode" });
        }
    });
}
function addSeasonsToSeries(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { seasons } = req.body;
        try {
            if (!Array.isArray(seasons) || seasons.length === 0) {
                return res.status(400).json({ data: null, error: "Seasons array is required" });
            }
            const series = yield db_1.db.series.findUnique({
                where: { id },
                select: { id: true, totalSeasons: true, totalEpisodes: true },
            });
            if (!series) {
                return res.status(404).json({ data: null, error: "Series not found" });
            }
            const existingSeasons = yield db_1.db.season.findMany({
                where: { seriesId: id },
                select: { seasonNumber: true },
            });
            const existingSeasonNumbers = new Set(existingSeasons.map((s) => s.seasonNumber));
            const newSeasonsData = [];
            let newEpisodesCount = 0;
            for (const seasonData of seasons) {
                if (existingSeasonNumbers.has(seasonData.seasonNumber)) {
                    continue;
                }
                newSeasonsData.push({
                    seriesId: id,
                    seasonNumber: seasonData.seasonNumber,
                    title: seasonData.title || `Season ${seasonData.seasonNumber}`,
                    description: seasonData.description || "",
                    poster: seasonData.poster || "",
                    releaseYear: seasonData.releaseYear || null,
                    totalEpisodes: Array.isArray(seasonData.episodes) ? seasonData.episodes.length : 0,
                });
                newEpisodesCount += Array.isArray(seasonData.episodes) ? seasonData.episodes.length : 0;
            }
            const result = yield db_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const createdSeasons = yield tx.season.createManyAndReturn({
                    data: newSeasonsData,
                });
                for (let i = 0; i < createdSeasons.length; i++) {
                    const season = createdSeasons[i];
                    const originalSeason = seasons.find((s) => s.seasonNumber === season.seasonNumber);
                    if (Array.isArray(originalSeason === null || originalSeason === void 0 ? void 0 : originalSeason.episodes) && originalSeason.episodes.length > 0) {
                        const episodesData = originalSeason.episodes.map((ep) => ({
                            seasonId: season.id,
                            episodeNumber: ep.episodeNumber,
                            title: ep.title || `Episode ${ep.episodeNumber}`,
                            description: ep.description || "",
                            videoUrl: ep.videoUrl || "",
                            poster: ep.poster || "",
                            length: ep.length || "",
                            lengthSeconds: ep.lengthSeconds || null,
                            releaseDate: ep.releaseDate ? new Date(ep.releaseDate) : null,
                        }));
                        yield tx.episode.createMany({ data: episodesData });
                    }
                }
                const updatedSeries = yield db_1.db.series.update({
                    where: { id },
                    data: {
                        totalSeasons: { increment: createdSeasons.length },
                        totalEpisodes: { increment: newEpisodesCount },
                    },
                    include: {
                        seasons: {
                            orderBy: { seasonNumber: "asc" },
                            include: {
                                episodes: {
                                    orderBy: { episodeNumber: "asc" },
                                    select: { id: true, episodeNumber: true, title: true, videoUrl: true },
                                },
                            },
                        },
                    },
                });
                return updatedSeries;
            }));
            return res.status(201).json({ data: serializeBigInt(result), error: null });
        }
        catch (error) {
            console.error("Error adding seasons:", error);
            return res.status(500).json({ data: null, error: "Failed to add seasons" });
        }
    });
}
