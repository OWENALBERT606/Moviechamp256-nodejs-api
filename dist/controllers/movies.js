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
exports.createMovie = createMovie;
exports.getAllMovies = getAllMovies;
exports.getMovieById = getMovieById;
exports.getMovieBySlug = getMovieBySlug;
exports.updateMovie = updateMovie;
exports.deleteMovie = deleteMovie;
exports.incrementViewCount = incrementViewCount;
exports.getTrendingMovies = getTrendingMovies;
exports.getComingSoonMovies = getComingSoonMovies;
const db_1 = require("../db/db");
const r2_delete_1 = require("../services/r2-delete");
const cache_1 = require("../utils/cache");
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
function createMovie(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { title, image, poster, trailerPoster, rating, vjId, genreId, yearId, size, sizeBytes, length, lengthSeconds, description, director, cast, trailerUrl, videoUrl, isComingSoon, isTrending, } = req.body;
        try {
            if (!title || !title.trim()) {
                return res.status(400).json({ data: null, error: "Movie title is required" });
            }
            if (!vjId || !genreId || !yearId) {
                return res.status(400).json({ data: null, error: "VJ, Genre, and Year are required" });
            }
            const titleNorm = title.trim();
            const slug = generateSlug(titleNorm);
            const existingMovie = yield db_1.db.movie.findUnique({
                where: { slug },
                select: { id: true },
            });
            if (existingMovie) {
                return res.status(409).json({
                    data: null,
                    error: "Movie with this title already exists",
                });
            }
            const newMovie = yield db_1.db.movie.create({
                data: {
                    title: titleNorm,
                    slug,
                    image: image || "",
                    poster: poster || "",
                    trailerPoster: trailerPoster || "",
                    rating: parseFloat(rating) || 0,
                    vjId,
                    genreId,
                    yearId,
                    size: size || "",
                    sizeBytes: sizeBytes ? BigInt(sizeBytes) : null,
                    length: length || "",
                    lengthSeconds: lengthSeconds ? parseInt(lengthSeconds) : null,
                    description: (description === null || description === void 0 ? void 0 : description.trim()) || "",
                    director: (director === null || director === void 0 ? void 0 : director.trim()) || "",
                    cast: Array.isArray(cast) ? cast : [],
                    trailerUrl: trailerUrl || "",
                    videoUrl: videoUrl || "",
                    isComingSoon: isComingSoon === true || isComingSoon === "true",
                    isTrending: isTrending === true || isTrending === "true",
                },
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
                },
            });
            return res.status(201).json({ data: serializeBigInt(newMovie), error: null });
        }
        catch (error) {
            console.error("Error creating movie:", error);
            return res.status(500).json({ data: null, error: "Failed to create movie" });
        }
    });
}
function getAllMovies(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { page = "1", limit = "100", genreId, vjId, yearId, isTrending, isComingSoon, search, } = req.query;
            const pageNum = parseInt(page);
            const limitNum = 100;
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
            const [movies, total] = yield Promise.all([
                db_1.db.movie.findMany({
                    where,
                    skip,
                    take: limitNum,
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
                    },
                }),
                db_1.db.movie.count({ where }),
            ]);
            const shuffled = movies.sort(() => Math.random() - 0.5);
            return res.status(200).json({
                data: serializeBigInt(shuffled),
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
            console.error("Error fetching movies:", (error === null || error === void 0 ? void 0 : error.message) || error);
            return res.status(500).json({ data: null, error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to fetch movies" });
        }
    });
}
function getMovieById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const movie = yield db_1.db.movie.findUnique({
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
                },
            });
            if (!movie) {
                return res.status(404).json({ data: null, error: "Movie not found" });
            }
            return res.status(200).json({ data: serializeBigInt(movie), error: null });
        }
        catch (error) {
            console.error("Error fetching movie by id:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function getMovieBySlug(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { slug } = req.params;
        try {
            const movie = yield db_1.db.movie.findUnique({
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
                },
            });
            if (!movie) {
                return res.status(404).json({ data: null, error: "Movie not found" });
            }
            return res.status(200).json({ data: serializeBigInt(movie), error: null });
        }
        catch (error) {
            console.error("Error fetching movie by slug:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function updateMovie(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { id } = req.params;
        const updateData = req.body;
        try {
            const existingMovie = yield db_1.db.movie.findUnique({ where: { id } });
            if (!existingMovie) {
                return res.status(404).json({ data: null, error: "Movie not found" });
            }
            let slug = existingMovie.slug;
            if (updateData.title && updateData.title.trim() !== existingMovie.title) {
                const titleNorm = updateData.title.trim();
                slug = generateSlug(titleNorm);
                const conflictMovie = yield db_1.db.movie.findFirst({
                    where: {
                        slug,
                        NOT: { id },
                    },
                    select: { id: true },
                });
                if (conflictMovie) {
                    return res.status(409).json({
                        data: null,
                        error: "Movie with this title already exists",
                    });
                }
            }
            const data = {
                slug,
            };
            if (updateData.title)
                data.title = updateData.title.trim();
            if (updateData.image !== undefined)
                data.image = updateData.image;
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
            if (updateData.size !== undefined)
                data.size = updateData.size;
            if (updateData.sizeBytes !== undefined)
                data.sizeBytes = updateData.sizeBytes ? BigInt(updateData.sizeBytes) : null;
            if (updateData.length !== undefined)
                data.length = updateData.length;
            if (updateData.lengthSeconds !== undefined)
                data.lengthSeconds = updateData.lengthSeconds ? parseInt(updateData.lengthSeconds) : null;
            if (updateData.description !== undefined)
                data.description = ((_a = updateData.description) === null || _a === void 0 ? void 0 : _a.trim()) || "";
            if (updateData.director !== undefined)
                data.director = ((_b = updateData.director) === null || _b === void 0 ? void 0 : _b.trim()) || "";
            if (updateData.cast !== undefined)
                data.cast = Array.isArray(updateData.cast) ? updateData.cast : [];
            if (updateData.trailerUrl !== undefined)
                data.trailerUrl = updateData.trailerUrl;
            if (updateData.videoUrl !== undefined)
                data.videoUrl = updateData.videoUrl;
            if (updateData.isComingSoon !== undefined)
                data.isComingSoon = updateData.isComingSoon === true || updateData.isComingSoon === "true";
            if (updateData.isTrending !== undefined)
                data.isTrending = updateData.isTrending === true || updateData.isTrending === "true";
            const updatedMovie = yield db_1.db.movie.update({
                where: { id },
                data,
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
                },
            });
            yield (0, cache_1.invalidateCache)(`movie:${id}`);
            return res.status(200).json({ data: serializeBigInt(updatedMovie), error: null });
        }
        catch (error) {
            console.error("Error updating movie:", error);
            return res.status(500).json({ data: null, error: "Failed to update movie" });
        }
    });
}
function deleteMovie(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const existingMovie = yield db_1.db.movie.findUnique({
                where: { id },
                select: { id: true, videoUrl: true, image: true, poster: true, trailerPoster: true },
            });
            if (!existingMovie) {
                return res.status(404).json({ data: null, error: "Movie not found" });
            }
            yield db_1.db.movie.delete({ where: { id } });
            yield (0, cache_1.invalidateCache)(`movie:${id}`);
            yield (0, r2_delete_1.deleteR2Files)([
                existingMovie.videoUrl,
                existingMovie.image,
                existingMovie.poster,
                existingMovie.trailerPoster,
            ]);
            return res.status(200).json({
                data: null,
                message: "Movie deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting movie:", error);
            return res.status(500).json({ data: null, error: "Failed to delete movie" });
        }
    });
}
function incrementViewCount(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const movie = yield db_1.db.movie.update({
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
            return res.status(200).json({ data: serializeBigInt(movie), error: null });
        }
        catch (error) {
            console.error("Error incrementing view count:", error);
            return res.status(500).json({ data: null, error: "Failed to increment view count" });
        }
    });
}
function getTrendingMovies(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { limit = "10" } = req.query;
        try {
            const movies = yield db_1.db.movie.findMany({
                where: { isTrending: true },
                take: parseInt(limit),
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
                },
            });
            return res.status(200).json({ data: serializeBigInt(movies), error: null });
        }
        catch (error) {
            console.error("Error fetching trending movies:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch trending movies" });
        }
    });
}
function getComingSoonMovies(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { limit = "10" } = req.query;
        try {
            const movies = yield db_1.db.movie.findMany({
                where: { isComingSoon: true },
                take: parseInt(limit),
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
                },
            });
            return res.status(200).json({ data: serializeBigInt(movies), error: null });
        }
        catch (error) {
            console.error("Error fetching coming soon movies:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch coming soon movies" });
        }
    });
}
