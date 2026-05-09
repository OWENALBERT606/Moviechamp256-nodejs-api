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
exports.globalSearch = globalSearch;
const db_1 = require("../db/db");
function serializeBigInt(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) => typeof value === "bigint" ? value.toString() : value));
}
function globalSearch(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { q, limit = 20 } = req.query;
        try {
            if (!q || typeof q !== "string" || q.trim().length === 0) {
                return res.status(400).json({
                    data: null,
                    error: "Search query is required"
                });
            }
            const searchTerm = q.trim().toLowerCase();
            const movies = yield db_1.db.movie.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm, mode: "insensitive" } },
                        { description: { contains: searchTerm, mode: "insensitive" } },
                        { director: { contains: searchTerm, mode: "insensitive" } },
                    ],
                },
                include: {
                    vj: true,
                    genre: true,
                    year: true,
                },
                take: Number(limit),
            });
            const series = yield db_1.db.series.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm, mode: "insensitive" } },
                        { description: { contains: searchTerm, mode: "insensitive" } },
                        { director: { contains: searchTerm, mode: "insensitive" } },
                    ],
                },
                include: {
                    vj: true,
                    genre: true,
                    year: true,
                },
                take: Number(limit),
            });
            const vjs = yield db_1.db.vJ.findMany({
                where: {
                    name: { contains: searchTerm, mode: "insensitive" },
                },
                take: 5,
            });
            const genres = yield db_1.db.genre.findMany({
                where: {
                    name: { contains: searchTerm, mode: "insensitive" },
                },
                take: 5,
            });
            const results = {
                movies: serializeBigInt(movies),
                series: serializeBigInt(series),
                vjs: serializeBigInt(vjs),
                genres: serializeBigInt(genres),
                totalResults: movies.length + series.length + vjs.length + genres.length,
            };
            return res.status(200).json({
                data: results,
                error: null,
            });
        }
        catch (error) {
            console.error("Error performing global search:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to perform search",
            });
        }
    });
}
