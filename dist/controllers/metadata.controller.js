"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.searchMovie = searchMovie;
exports.searchSeries = searchSeries;
exports.enrichMovie = enrichMovie;
exports.enrichSeries = enrichSeries;
exports.enrichSeason = enrichSeason;
exports.enrichEpisode = enrichEpisode;
exports.upcomingMovies = upcomingMovies;
exports.upcomingSeries = upcomingSeries;
exports.importSeriesFromTmdb = importSeriesFromTmdb;
const db_1 = require("../db/db");
const metadata_service_1 = require("../services/metadata/metadata.service");
const tmdb_series_service_1 = require("../services/metadata/tmdb-series.service");
const tmdb_service_1 = require("../services/metadata/tmdb.service");
function searchMovie(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { title } = req.query;
        if (!title || typeof title !== "string") {
            return res.status(400).json({ success: false, error: "title query param is required" });
        }
        try {
            const results = yield (0, metadata_service_1.fetchMovieMetadata)(title.trim());
            return res.status(200).json({ success: true, data: results });
        }
        catch (e) {
            console.error("[metadata.controller] searchMovie error:", e.message);
            return res.status(500).json({ success: false, error: "Failed to search movies" });
        }
    });
}
function searchSeries(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { title } = req.query;
        if (!title || typeof title !== "string") {
            return res.status(400).json({ success: false, error: "title query param is required" });
        }
        try {
            const results = yield (0, metadata_service_1.fetchSeriesMetadata)(title.trim());
            return res.status(200).json({ success: true, data: results });
        }
        catch (e) {
            console.error("[metadata.controller] searchSeries error:", e.message);
            return res.status(500).json({ success: false, error: "Failed to search series" });
        }
    });
}
function enrichMovie(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tmdbId = parseInt(req.params.tmdbId);
        if (isNaN(tmdbId)) {
            return res.status(400).json({ success: false, error: "Invalid tmdbId" });
        }
        try {
            const data = yield (0, metadata_service_1.enrichMovieById)(tmdbId, db_1.db);
            return res.status(200).json({ success: true, data });
        }
        catch (e) {
            console.error("[metadata.controller] enrichMovie error:", e.message);
            return res.status(500).json({ success: false, error: "Failed to enrich movie metadata" });
        }
    });
}
function enrichSeries(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tmdbId = parseInt(req.params.tmdbId);
        if (isNaN(tmdbId)) {
            return res.status(400).json({ success: false, error: "Invalid tmdbId" });
        }
        try {
            const data = yield (0, metadata_service_1.enrichSeriesById)(tmdbId, db_1.db);
            return res.status(200).json({ success: true, data });
        }
        catch (e) {
            console.error("[metadata.controller] enrichSeries error:", e.message);
            return res.status(500).json({ success: false, error: "Failed to enrich series metadata" });
        }
    });
}
function enrichSeason(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tmdbSeriesId = parseInt(req.params.tmdbSeriesId);
        const seasonNumber = parseInt(req.params.seasonNumber);
        if (isNaN(tmdbSeriesId) || isNaN(seasonNumber)) {
            return res.status(400).json({ success: false, error: "Invalid tmdbSeriesId or seasonNumber" });
        }
        try {
            const data = yield (0, tmdb_series_service_1.getTmdbSeasonDetails)(tmdbSeriesId, seasonNumber);
            if (!data)
                return res.status(404).json({ success: false, error: "Season not found on TMDB" });
            return res.status(200).json({ success: true, data });
        }
        catch (e) {
            console.error("[metadata.controller] enrichSeason error:", e.message);
            return res.status(500).json({ success: false, error: "Failed to fetch season metadata" });
        }
    });
}
function enrichEpisode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tmdbSeriesId = parseInt(req.params.tmdbSeriesId);
        const seasonNumber = parseInt(req.params.seasonNumber);
        const episodeNumber = parseInt(req.params.episodeNumber);
        if (isNaN(tmdbSeriesId) || isNaN(seasonNumber) || isNaN(episodeNumber)) {
            return res.status(400).json({ success: false, error: "Invalid parameters" });
        }
        try {
            const data = yield (0, tmdb_series_service_1.getTmdbEpisodeDetails)(tmdbSeriesId, seasonNumber, episodeNumber);
            if (!data)
                return res.status(404).json({ success: false, error: "Episode not found on TMDB" });
            return res.status(200).json({ success: true, data });
        }
        catch (e) {
            console.error("[metadata.controller] enrichEpisode error:", e.message);
            return res.status(500).json({ success: false, error: "Failed to fetch episode metadata" });
        }
    });
}
function upcomingMovies(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const limit = parseInt(req.query.limit || "20");
        try {
            const data = yield (0, tmdb_service_1.getUpcomingMovies)(limit);
            return res.status(200).json({ success: true, data });
        }
        catch (e) {
            console.error("[metadata.controller] upcomingMovies error:", e.message);
            return res.status(500).json({ success: false, error: "Failed to fetch upcoming movies" });
        }
    });
}
function upcomingSeries(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const limit = parseInt(req.query.limit || "20");
        try {
            const data = yield (0, tmdb_service_1.getUpcomingSeries)(limit);
            return res.status(200).json({ success: true, data });
        }
        catch (e) {
            console.error("[metadata.controller] upcomingSeries error:", e.message);
            return res.status(500).json({ success: false, error: "Failed to fetch upcoming series" });
        }
    });
}
function importSeriesFromTmdb(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { seriesId } = req.params;
        const { tmdbSeriesId, seriesPoster } = req.body;
        if (!tmdbSeriesId || isNaN(parseInt(tmdbSeriesId))) {
            return res.status(400).json({ success: false, error: "tmdbSeriesId is required" });
        }
        try {
            const { getSeriesDetails } = yield Promise.resolve().then(() => __importStar(require("../services/metadata/tmdb.service")));
            const seriesDetails = yield getSeriesDetails(parseInt(tmdbSeriesId));
            if (!seriesDetails) {
                return res.status(404).json({ success: false, error: "Series not found on TMDB" });
            }
            const totalSeasons = seriesDetails.totalSeasons || 0;
            if (totalSeasons === 0) {
                return res.status(200).json({ success: true, data: { seasonsCreated: 0, episodesCreated: 0 } });
            }
            let seasonsCreated = 0;
            let episodesCreated = 0;
            const errors = [];
            for (let sNum = 1; sNum <= totalSeasons; sNum++) {
                try {
                    const { getTmdbSeasonDetails } = yield Promise.resolve().then(() => __importStar(require("../services/metadata/tmdb-series.service")));
                    const seasonData = yield getTmdbSeasonDetails(parseInt(tmdbSeriesId), sNum);
                    if (!seasonData)
                        continue;
                    const existingSeason = yield db_1.db.season.findFirst({
                        where: { seriesId, seasonNumber: sNum },
                    });
                    let seasonId;
                    if (existingSeason) {
                        seasonId = existingSeason.id;
                    }
                    else {
                        const newSeason = yield db_1.db.season.create({
                            data: {
                                seriesId,
                                seasonNumber: sNum,
                                title: seasonData.title || `Season ${sNum}`,
                                description: seasonData.description || undefined,
                                poster: seriesPoster || undefined,
                                releaseYear: seasonData.releaseYear || undefined,
                                totalEpisodes: seasonData.episodes.length,
                            },
                        });
                        seasonId = newSeason.id;
                        seasonsCreated++;
                        yield db_1.db.series.update({
                            where: { id: seriesId },
                            data: { totalSeasons: { increment: 1 } },
                        });
                    }
                    for (const ep of seasonData.episodes) {
                        try {
                            const existing = yield db_1.db.episode.findFirst({
                                where: { seasonId, episodeNumber: ep.episodeNumber },
                            });
                            if (existing)
                                continue;
                            yield db_1.db.episode.create({
                                data: {
                                    seasonId,
                                    episodeNumber: ep.episodeNumber,
                                    title: ep.title || `Episode ${ep.episodeNumber}`,
                                    description: ep.description || undefined,
                                    videoUrl: "",
                                    poster: seriesPoster || undefined,
                                    length: ep.length || undefined,
                                    lengthSeconds: ep.lengthSeconds || undefined,
                                    releaseDate: ep.releaseDate ? new Date(ep.releaseDate) : undefined,
                                },
                            });
                            episodesCreated++;
                        }
                        catch (epErr) {
                            errors.push(`S${sNum}E${ep.episodeNumber}: ${epErr.message}`);
                        }
                    }
                    yield db_1.db.season.update({
                        where: { id: seasonId },
                        data: { totalEpisodes: seasonData.episodes.length },
                    });
                }
                catch (sErr) {
                    errors.push(`Season ${sNum}: ${sErr.message}`);
                }
            }
            const totalEps = yield db_1.db.episode.count({ where: { season: { seriesId } } });
            yield db_1.db.series.update({
                where: { id: seriesId },
                data: { totalEpisodes: totalEps },
            });
            return res.status(200).json({
                success: true,
                data: { seasonsCreated, episodesCreated, errors },
                message: `Created ${seasonsCreated} seasons and ${episodesCreated} episodes`,
            });
        }
        catch (e) {
            console.error("[metadata.controller] importSeriesFromTmdb error:", e.message);
            return res.status(500).json({ success: false, error: e.message || "Import failed" });
        }
    });
}
