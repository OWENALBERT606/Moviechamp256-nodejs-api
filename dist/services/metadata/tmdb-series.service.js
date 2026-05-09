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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTmdbSeasonDetails = getTmdbSeasonDetails;
exports.getTmdbEpisodeDetails = getTmdbEpisodeDetails;
const axios_1 = __importDefault(require("axios"));
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p/w500";
const TMDB_STILL_BASE = "https://image.tmdb.org/t/p/w300";
const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const ONE_HOUR = 60 * 60 * 1000;
const cache = new Map();
function getCache(key) {
    const e = cache.get(key);
    if (!e || Date.now() > e.expiresAt) {
        cache.delete(key);
        return null;
    }
    return e.data;
}
function setCache(key, data, ttl = ONE_HOUR) {
    cache.set(key, { data, expiresAt: Date.now() + ttl });
}
function tmdbGet(path, params = {}) {
    return axios_1.default.get(`${TMDB_BASE_URL}${path}`, {
        params: Object.assign({ api_key: TMDB_API_KEY }, params),
        timeout: 10000,
    });
}
function getTmdbSeasonDetails(tmdbSeriesId, seasonNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const cacheKey = `season:${tmdbSeriesId}:${seasonNumber}`;
        const cached = getCache(cacheKey);
        if (cached)
            return cached;
        try {
            const res = yield tmdbGet(`/tv/${tmdbSeriesId}/season/${seasonNumber}`, {
                append_to_response: "images",
            });
            const s = res.data;
            const result = {
                seasonNumber: s.season_number,
                title: s.name || null,
                description: s.overview || null,
                poster: s.poster_path ? `${TMDB_IMAGE_BASE}${s.poster_path}` : null,
                releaseYear: s.air_date ? new Date(s.air_date).getFullYear() : null,
                posterOptions: (((_a = s.images) === null || _a === void 0 ? void 0 : _a.posters) || [])
                    .slice(0, 5)
                    .map((p) => `${TMDB_IMAGE_BASE}${p.file_path}`),
                episodes: (s.episodes || []).map((ep) => ({
                    episodeNumber: ep.episode_number,
                    title: ep.name || `Episode ${ep.episode_number}`,
                    description: ep.overview || null,
                    poster: ep.still_path ? `${TMDB_STILL_BASE}${ep.still_path}` : null,
                    length: ep.runtime ? (ep.runtime >= 60
                        ? `${Math.floor(ep.runtime / 60)}h ${ep.runtime % 60}m`
                        : `${ep.runtime}m`) : null,
                    lengthSeconds: ep.runtime ? ep.runtime * 60 : null,
                    releaseDate: ep.air_date || null,
                })),
            };
            setCache(cacheKey, result);
            return result;
        }
        catch (e) {
            console.error("[tmdb-series.service] getTmdbSeasonDetails error:", e.message);
            return null;
        }
    });
}
function getTmdbEpisodeDetails(tmdbSeriesId, seasonNumber, episodeNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const cacheKey = `episode:${tmdbSeriesId}:${seasonNumber}:${episodeNumber}`;
        const cached = getCache(cacheKey);
        if (cached)
            return cached;
        try {
            const res = yield tmdbGet(`/tv/${tmdbSeriesId}/season/${seasonNumber}/episode/${episodeNumber}`, { append_to_response: "images" });
            const ep = res.data;
            const result = {
                episodeNumber: ep.episode_number,
                title: ep.name || `Episode ${ep.episode_number}`,
                description: ep.overview || null,
                poster: ep.still_path ? `${TMDB_STILL_BASE}${ep.still_path}` : null,
                stillOptions: (((_a = ep.images) === null || _a === void 0 ? void 0 : _a.stills) || [])
                    .slice(0, 5)
                    .map((s) => `${TMDB_STILL_BASE}${s.file_path}`),
                length: ep.runtime ? (ep.runtime >= 60
                    ? `${Math.floor(ep.runtime / 60)}h ${ep.runtime % 60}m`
                    : `${ep.runtime}m`) : null,
                lengthSeconds: ep.runtime ? ep.runtime * 60 : null,
                releaseDate: ep.air_date || null,
                director: ((_b = (ep.crew || []).find((c) => c.job === "Director")) === null || _b === void 0 ? void 0 : _b.name) || null,
                writers: (ep.crew || [])
                    .filter((c) => c.job === "Writer" || c.department === "Writing")
                    .slice(0, 3)
                    .map((c) => c.name),
            };
            setCache(cacheKey, result);
            return result;
        }
        catch (e) {
            console.error("[tmdb-series.service] getTmdbEpisodeDetails error:", e.message);
            return null;
        }
    });
}
