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
exports.createVJ = createVJ;
exports.getAllVJs = getAllVJs;
exports.getVJById = getVJById;
exports.getVJByName = getVJByName;
exports.updateVJ = updateVJ;
exports.deleteVJ = deleteVJ;
const db_1 = require("../db/db");
function generateSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function createVJ(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, bio, avatarUrl } = req.body;
        try {
            if (!name || !name.trim()) {
                return res.status(400).json({ data: null, error: "VJ name is required" });
            }
            const nameNorm = name.trim();
            const existingVJ = yield db_1.db.vJ.findUnique({
                where: { name: nameNorm },
                select: { id: true },
            });
            if (existingVJ) {
                return res.status(409).json({
                    data: null,
                    error: "VJ with this name already exists",
                });
            }
            const newVJ = yield db_1.db.vJ.create({
                data: {
                    name: nameNorm,
                    bio: (bio === null || bio === void 0 ? void 0 : bio.trim()) || null,
                    avatarUrl: (avatarUrl === null || avatarUrl === void 0 ? void 0 : avatarUrl.trim()) || undefined,
                },
                select: {
                    id: true,
                    name: true,
                    bio: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return res.status(201).json({ data: newVJ, error: null });
        }
        catch (error) {
            console.error("Error creating VJ:", error);
            return res.status(500).json({ data: null, error: "Failed to create VJ" });
        }
    });
}
function getAllVJs(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const vjs = yield db_1.db.vJ.findMany({
                orderBy: { name: "asc" },
                select: {
                    id: true,
                    name: true,
                    bio: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            return res.status(200).json({ data: vjs, error: null });
        }
        catch (error) {
            console.error("Error fetching VJs:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch VJs" });
        }
    });
}
function getVJById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const vj = yield db_1.db.vJ.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    bio: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            if (!vj) {
                return res.status(404).json({ data: null, error: "VJ not found" });
            }
            return res.status(200).json({ data: vj, error: null });
        }
        catch (error) {
            console.error("Error fetching VJ by id:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function getVJByName(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name } = req.params;
        try {
            const vj = yield db_1.db.vJ.findUnique({
                where: { name: decodeURIComponent(name) },
                select: {
                    id: true,
                    name: true,
                    bio: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            if (!vj) {
                return res.status(404).json({ data: null, error: "VJ not found" });
            }
            return res.status(200).json({ data: vj, error: null });
        }
        catch (error) {
            console.error("Error fetching VJ by name:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function updateVJ(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { id } = req.params;
        const { name, bio, avatarUrl } = req.body;
        try {
            const existingVJ = yield db_1.db.vJ.findUnique({ where: { id } });
            if (!existingVJ) {
                return res.status(404).json({ data: null, error: "VJ not found" });
            }
            if (name && name.trim() !== existingVJ.name) {
                const nameNorm = name.trim();
                const conflictVJ = yield db_1.db.vJ.findFirst({
                    where: {
                        name: nameNorm,
                        NOT: { id },
                    },
                    select: { id: true },
                });
                if (conflictVJ) {
                    return res.status(409).json({
                        data: null,
                        error: "VJ with this name already exists",
                    });
                }
            }
            const updatedVJ = yield db_1.db.vJ.update({
                where: { id },
                data: {
                    name: (_a = name === null || name === void 0 ? void 0 : name.trim()) !== null && _a !== void 0 ? _a : existingVJ.name,
                    bio: bio !== undefined ? (bio === null || bio === void 0 ? void 0 : bio.trim()) || null : existingVJ.bio,
                    avatarUrl: (_b = avatarUrl === null || avatarUrl === void 0 ? void 0 : avatarUrl.trim()) !== null && _b !== void 0 ? _b : existingVJ.avatarUrl,
                },
                select: {
                    id: true,
                    name: true,
                    bio: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            return res.status(200).json({ data: updatedVJ, error: null });
        }
        catch (error) {
            console.error("Error updating VJ:", error);
            return res.status(500).json({ data: null, error: "Failed to update VJ" });
        }
    });
}
function deleteVJ(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const existingVJ = yield db_1.db.vJ.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            if (!existingVJ) {
                return res.status(404).json({ data: null, error: "VJ not found" });
            }
            if (existingVJ._count.movies > 0) {
                return res.status(400).json({
                    data: null,
                    error: `Cannot delete VJ. It has ${existingVJ._count.movies} movie(s) associated with it.`,
                });
            }
            yield db_1.db.vJ.delete({ where: { id } });
            return res.status(200).json({
                data: null,
                message: "VJ deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting VJ:", error);
            return res.status(500).json({ data: null, error: "Failed to delete VJ" });
        }
    });
}
