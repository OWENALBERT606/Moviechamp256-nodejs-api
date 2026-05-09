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
exports.createGenre = createGenre;
exports.getAllGenres = getAllGenres;
exports.getGenreById = getGenreById;
exports.getGenreBySlug = getGenreBySlug;
exports.updateGenre = updateGenre;
exports.deleteGenre = deleteGenre;
const db_1 = require("../db/db");
function generateSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function createGenre(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, description } = req.body;
        try {
            if (!name || !name.trim()) {
                return res.status(400).json({ data: null, error: "Genre name is required" });
            }
            const nameNorm = name.trim();
            const slug = generateSlug(nameNorm);
            const existingGenre = yield db_1.db.genre.findFirst({
                where: {
                    OR: [{ name: nameNorm }, { slug }],
                },
                select: { id: true },
            });
            if (existingGenre) {
                return res.status(409).json({
                    data: null,
                    error: "Genre with this name already exists",
                });
            }
            const newGenre = yield db_1.db.genre.create({
                data: {
                    name: nameNorm,
                    slug,
                    description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return res.status(201).json({ data: newGenre, error: null });
        }
        catch (error) {
            console.error("Error creating genre:", error);
            return res.status(500).json({ data: null, error: "Failed to create genre" });
        }
    });
}
function getAllGenres(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const genres = yield db_1.db.genre.findMany({
                orderBy: { name: "asc" },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            return res.status(200).json({ data: genres, error: null });
        }
        catch (error) {
            console.error("Error fetching genres:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch genres" });
        }
    });
}
function getGenreById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const genre = yield db_1.db.genre.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            if (!genre) {
                return res.status(404).json({ data: null, error: "Genre not found" });
            }
            return res.status(200).json({ data: genre, error: null });
        }
        catch (error) {
            console.error("Error fetching genre by id:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function getGenreBySlug(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { slug } = req.params;
        try {
            const genre = yield db_1.db.genre.findUnique({
                where: { slug },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            if (!genre) {
                return res.status(404).json({ data: null, error: "Genre not found" });
            }
            return res.status(200).json({ data: genre, error: null });
        }
        catch (error) {
            console.error("Error fetching genre by slug:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function updateGenre(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const { name, description } = req.body;
        try {
            const existingGenre = yield db_1.db.genre.findUnique({ where: { id } });
            if (!existingGenre) {
                return res.status(404).json({ data: null, error: "Genre not found" });
            }
            let slug = existingGenre.slug;
            if (name && name.trim() !== existingGenre.name) {
                const nameNorm = name.trim();
                slug = generateSlug(nameNorm);
                const conflictGenre = yield db_1.db.genre.findFirst({
                    where: {
                        OR: [{ name: nameNorm }, { slug }],
                        NOT: { id },
                    },
                    select: { id: true },
                });
                if (conflictGenre) {
                    return res.status(409).json({
                        data: null,
                        error: "Genre with this name already exists",
                    });
                }
            }
            const updatedGenre = yield db_1.db.genre.update({
                where: { id },
                data: {
                    name: (_a = name === null || name === void 0 ? void 0 : name.trim()) !== null && _a !== void 0 ? _a : existingGenre.name,
                    slug,
                    description: description !== undefined ? (description === null || description === void 0 ? void 0 : description.trim()) || null : existingGenre.description,
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            return res.status(200).json({ data: updatedGenre, error: null });
        }
        catch (error) {
            console.error("Error updating genre:", error);
            return res.status(500).json({ data: null, error: "Failed to update genre" });
        }
    });
}
function deleteGenre(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const existingGenre = yield db_1.db.genre.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            if (!existingGenre) {
                return res.status(404).json({ data: null, error: "Genre not found" });
            }
            if (existingGenre._count.movies > 0) {
                return res.status(400).json({
                    data: null,
                    error: `Cannot delete genre. It has ${existingGenre._count.movies} movie(s) associated with it.`,
                });
            }
            yield db_1.db.genre.delete({ where: { id } });
            return res.status(200).json({
                data: null,
                message: "Genre deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting genre:", error);
            return res.status(500).json({ data: null, error: "Failed to delete genre" });
        }
    });
}
