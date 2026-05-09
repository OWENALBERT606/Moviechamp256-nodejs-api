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
exports.createReleaseYear = createReleaseYear;
exports.getAllReleaseYears = getAllReleaseYears;
exports.getReleaseYearById = getReleaseYearById;
exports.getReleaseYearByValue = getReleaseYearByValue;
exports.updateReleaseYear = updateReleaseYear;
exports.deleteReleaseYear = deleteReleaseYear;
const db_1 = require("../db/db");
function createReleaseYear(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { value } = req.body;
        try {
            if (!value || typeof value !== "number") {
                return res.status(400).json({ data: null, error: "Year value is required and must be a number" });
            }
            const currentYear = new Date().getFullYear();
            if (value < 1888 || value > currentYear + 5) {
                return res.status(400).json({
                    data: null,
                    error: `Year must be between 1888 and ${currentYear + 5}`
                });
            }
            const existingYear = yield db_1.db.releaseYear.findUnique({
                where: { value },
                select: { id: true },
            });
            if (existingYear) {
                return res.status(409).json({
                    data: null,
                    error: "This year already exists",
                });
            }
            const newYear = yield db_1.db.releaseYear.create({
                data: { value },
                select: {
                    id: true,
                    value: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return res.status(201).json({ data: newYear, error: null });
        }
        catch (error) {
            console.error("Error creating release year:", error);
            return res.status(500).json({ data: null, error: "Failed to create release year" });
        }
    });
}
function getAllReleaseYears(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const years = yield db_1.db.releaseYear.findMany({
                orderBy: { value: "desc" },
                select: {
                    id: true,
                    value: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            return res.status(200).json({ data: years, error: null });
        }
        catch (error) {
            console.error("Error fetching release years:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch release years" });
        }
    });
}
function getReleaseYearById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const year = yield db_1.db.releaseYear.findUnique({
                where: { id },
                select: {
                    id: true,
                    value: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            if (!year) {
                return res.status(404).json({ data: null, error: "Release year not found" });
            }
            return res.status(200).json({ data: year, error: null });
        }
        catch (error) {
            console.error("Error fetching release year by id:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function getReleaseYearByValue(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { value } = req.params;
        try {
            const yearValue = parseInt(value);
            if (isNaN(yearValue)) {
                return res.status(400).json({ data: null, error: "Invalid year value" });
            }
            const year = yield db_1.db.releaseYear.findUnique({
                where: { value: yearValue },
                select: {
                    id: true,
                    value: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            if (!year) {
                return res.status(404).json({ data: null, error: "Release year not found" });
            }
            return res.status(200).json({ data: year, error: null });
        }
        catch (error) {
            console.error("Error fetching release year by value:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function updateReleaseYear(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { value } = req.body;
        try {
            const existingYear = yield db_1.db.releaseYear.findUnique({ where: { id } });
            if (!existingYear) {
                return res.status(404).json({ data: null, error: "Release year not found" });
            }
            if (value !== undefined) {
                const currentYear = new Date().getFullYear();
                if (value < 1888 || value > currentYear + 5) {
                    return res.status(400).json({
                        data: null,
                        error: `Year must be between 1888 and ${currentYear + 5}`
                    });
                }
                const conflictYear = yield db_1.db.releaseYear.findFirst({
                    where: {
                        value,
                        NOT: { id },
                    },
                    select: { id: true },
                });
                if (conflictYear) {
                    return res.status(409).json({
                        data: null,
                        error: "This year already exists",
                    });
                }
            }
            const updatedYear = yield db_1.db.releaseYear.update({
                where: { id },
                data: {
                    value: value !== null && value !== void 0 ? value : existingYear.value,
                },
                select: {
                    id: true,
                    value: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            return res.status(200).json({ data: updatedYear, error: null });
        }
        catch (error) {
            console.error("Error updating release year:", error);
            return res.status(500).json({ data: null, error: "Failed to update release year" });
        }
    });
}
function deleteReleaseYear(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const existingYear = yield db_1.db.releaseYear.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { movies: true },
                    },
                },
            });
            if (!existingYear) {
                return res.status(404).json({ data: null, error: "Release year not found" });
            }
            if (existingYear._count.movies > 0) {
                return res.status(400).json({
                    data: null,
                    error: `Cannot delete year. It has ${existingYear._count.movies} movie(s) associated with it.`,
                });
            }
            yield db_1.db.releaseYear.delete({ where: { id } });
            return res.status(200).json({
                data: null,
                message: "Release year deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting release year:", error);
            return res.status(500).json({ data: null, error: "Failed to delete release year" });
        }
    });
}
