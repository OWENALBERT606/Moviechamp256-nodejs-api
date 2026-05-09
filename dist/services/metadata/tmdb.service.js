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
exports.searchMovies = searchMovies;
exports.searchSeries = searchSeries;
exports.getMovieDetails = getMovieDetails;
exports.getSeriesDetails = getSeriesDetails;
exports.getTrendingMovieIds = getTrendingMovieIds;
exports.getUpcomingMovieIds = getUpcomingMovieIds;
exports.getUpcomingMovies = getUpcomingMovies;
exports.getUpcomingSeries = getUpcomingSeries;
const axios_1 = __importDefault(require("axios"));
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_BASE = process.env.TMDB_BACKDROP_BASE || "https://image.tmdb.org/t/p/original";
const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const cache = new Map();
function getCache(key) {
    const entry = cache.get(key);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}
function setCache(key, data, ttlMs) {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
const SIX_HOURS = 6 * 60 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
function tmdbGet(path, params = {}) {
    return axios_1.default.get(`${TMDB_BASE_URL}${path}`, {
        params: Object.assign({ api_key: TMDB_API_KEY }, params),
        timeout: 8000,
    });
}
function searchMovies(title) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield tmdbGet("/search/movie", { query: title, include_adult: false });
            return (res.data.results || []).map((m) => ({
                tmdbId: m.id,
                title: m.title,
                year: m.release_date ? m.release_date.slice(0, 4) : null,
                poster: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
                overview: m.overview,
            }));
        }
        catch (e) {
            console.error("[tmdb.service] searchMovies error:", e.message);
            return [];
        }
    });
}
function searchSeries(title) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield tmdbGet("/search/tv", { query: title, include_adult: false });
            return (res.data.results || []).map((s) => ({
                tmdbId: s.id,
                title: s.name,
                year: s.first_air_date ? s.first_air_date.slice(0, 4) : null,
                poster: s.poster_path ? `${TMDB_IMAGE_BASE}${s.poster_path}` : null,
                overview: s.overview,
            }));
        }
        catch (e) {
            console.error("[tmdb.service] searchSeries error:", e.message);
            return [];
        }
    });
}
function getMovieDetails(tmdbId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const cacheKey = `movie:${tmdbId}`;
        const cached = getCache(cacheKey);
        if (cached)
            return cached;
        try {
            const res = yield tmdbGet(`/movie/${tmdbId}`, {
                append_to_response: "credits,videos,images",
            });
            const m = res.data;
            const runtime = m.runtime || 0;
            const hours = Math.floor(runtime / 60);
            const mins = runtime % 60;
            const length = runtime > 60 ? `${hours}h ${mins}m` : `${runtime}m`;
            const trendingIds = yield getTrendingMovieIds();
            const upcomingIds = yield getUpcomingMovieIds();
            const tmdbTrailerKey = (_c = (_b = (((_a = m.videos) === null || _a === void 0 ? void 0 : _a.results) || []).find((v) => v.type === "Trailer" && v.site === "YouTube")) === null || _b === void 0 ? void 0 : _b.key) !== null && _c !== void 0 ? _c : null;
            const posterOptions = (((_d = m.images) === null || _d === void 0 ? void 0 : _d.posters) || [])
                .slice(0, 5)
                .map((p) => `${TMDB_IMAGE_BASE}${p.file_path}`);
            const result = {
                title: m.title,
                description: m.overview || "",
                poster: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
                image: m.backdrop_path ? `${TMDB_BACKDROP_BASE}${m.backdrop_path}` : null,
                trailerPoster: m.backdrop_path ? `${TMDB_BACKDROP_BASE}${m.backdrop_path}` : null,
                director: (_g = (_f = (((_e = m.credits) === null || _e === void 0 ? void 0 : _e.crew) || []).find((p) => p.job === "Director")) === null || _f === void 0 ? void 0 : _f.name) !== null && _g !== void 0 ? _g : null,
                cast: (((_h = m.credits) === null || _h === void 0 ? void 0 : _h.cast) || []).slice(0, 10).map((p) => p.name),
                tmdbRating: parseFloat(m.vote_average) || 0,
                tmdbId: m.id,
                imdbId: m.imdb_id || null,
                runtime,
                length,
                lengthSeconds: runtime * 60,
                releaseDate: m.release_date || null,
                releaseYear: m.release_date ? m.release_date.slice(0, 4) : null,
                genres: (m.genres || []).map((g) => g.name),
                tmdbTrailerKey,
                isTrending: trendingIds.includes(m.id),
                isComingSoon: upcomingIds.includes(m.id),
                posterOptions,
            };
            setCache(cacheKey, result, ONE_HOUR);
            return result;
        }
        catch (e) {
            console.error("[tmdb.service] getMovieDetails error:", e.message);
            return null;
        }
    });
}
function getSeriesDetails(tmdbId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const cacheKey = `series:${tmdbId}`;
        const cached = getCache(cacheKey);
        if (cached)
            return cached;
        try {
            const res = yield tmdbGet(`/tv/${tmdbId}`, {
                append_to_response: "credits,videos,images",
            });
            const s = res.data;
            const tmdbTrailerKey = (_c = (_b = (((_a = s.videos) === null || _a === void 0 ? void 0 : _a.results) || []).find((v) => v.type === "Trailer" && v.site === "YouTube")) === null || _b === void 0 ? void 0 : _b.key) !== null && _c !== void 0 ? _c : null;
            const posterOptions = (((_d = s.images) === null || _d === void 0 ? void 0 : _d.posters) || [])
                .slice(0, 5)
                .map((p) => `${TMDB_IMAGE_BASE}${p.file_path}`);
            const result = {
                title: s.name,
                description: s.overview || "",
                poster: s.poster_path ? `${TMDB_IMAGE_BASE}${s.poster_path}` : null,
                image: s.backdrop_path ? `${TMDB_BACKDROP_BASE}${s.backdrop_path}` : null,
                trailerPoster: s.backdrop_path ? `${TMDB_BACKDROP_BASE}${s.backdrop_path}` : null,
                director: (_g = (_f = (((_e = s.credits) === null || _e === void 0 ? void 0 : _e.crew) || []).find((p) => p.job === "Director")) === null || _f === void 0 ? void 0 : _f.name) !== null && _g !== void 0 ? _g : null,
                cast: (((_h = s.credits) === null || _h === void 0 ? void 0 : _h.cast) || []).slice(0, 10).map((p) => p.name),
                tmdbRating: parseFloat(s.vote_average) || 0,
                tmdbId: s.id,
                imdbId: ((_j = s.external_ids) === null || _j === void 0 ? void 0 : _j.imdb_id) || null,
                releaseDate: s.first_air_date || null,
                releaseYear: s.first_air_date ? s.first_air_date.slice(0, 4) : null,
                genres: (s.genres || []).map((g) => g.name),
                totalSeasons: s.number_of_seasons || 0,
                totalEpisodes: s.number_of_episodes || 0,
                tmdbTrailerKey,
                isTrending: false,
                isComingSoon: false,
                posterOptions,
            };
            setCache(cacheKey, result, ONE_HOUR);
            return result;
        }
        catch (e) {
            console.error("[tmdb.service] getSeriesDetails error:", e.message);
            return null;
        }
    });
}
function getTrendingMovieIds() {
    return __awaiter(this, void 0, void 0, function* () {
        const cacheKey = "trending_movie_ids";
        const cached = getCache(cacheKey);
        if (cached)
            return cached;
        try {
            const res = yield tmdbGet("/trending/movie/week");
            const ids = (res.data.results || []).map((m) => m.id);
            setCache(cacheKey, ids, SIX_HOURS);
            return ids;
        }
        catch (e) {
            console.error("[tmdb.service] getTrendingMovieIds error:", e.message);
            return [];
        }
    });
}
function getUpcomingMovieIds() {
    return __awaiter(this, void 0, void 0, function* () {
        const cacheKey = "upcoming_movie_ids";
        const cached = getCache(cacheKey);
        if (cached)
            return cached;
        try {
            const res = yield tmdbGet("/movie/upcoming");
            const ids = (res.data.results || []).map((m) => m.id);
            setCache(cacheKey, ids, SIX_HOURS);
            return ids;
        }
        catch (e) {
            console.error("[tmdb.service] getUpcomingMovieIds error:", e.message);
            return [];
        }
    });
}
function getUpcomingMovies() {
    return __awaiter(this, arguments, void 0, function* (limit = 20) {
        const cacheKey = `upcoming_movies_full_${limit}`;
        const cached = getCache(cacheKey);
        if (cached)
            return cached;
        try {
            const res = yield tmdbGet("/movie/upcoming", { language: "en-US", page: 1 });
            const results = (res.data.results || []).slice(0, limit).map((m) => ({
                tmdbId: m.id,
                title: m.title,
                overview: m.overview || "",
                poster: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
                backdrop: m.backdrop_path ? `${TMDB_BACKDROP_BASE}${m.backdrop_path}` : null,
                releaseDate: m.release_date || null,
                releaseYear: m.release_date ? m.release_date.slice(0, 4) : null,
                rating: parseFloat(m.vote_average) || 0,
                genres: (m.genre_ids || []),
                source: "tmdb",
            }));
            setCache(cacheKey, results, SIX_HOURS);
            return results;
        }
        catch (e) {
            console.error("[tmdb.service] getUpcomingMovies error:", e.message);
            return [];
        }
    });
}
function getUpcomingSeries() {
    return __awaiter(this, arguments, void 0, function* (limit = 20) {
        const cacheKey = `upcoming_series_full_${limit}`;
        const cached = getCache(cacheKey);
        if (cached)
            return cached;
        try {
            const res = yield tmdbGet("/tv/on_the_air", { language: "en-US", page: 1 });
            const results = (res.data.results || []).slice(0, limit).map((s) => ({
                tmdbId: s.id,
                title: s.name,
                overview: s.overview || "",
                poster: s.poster_path ? `${TMDB_IMAGE_BASE}${s.poster_path}` : null,
                backdrop: s.backdrop_path ? `${TMDB_BACKDROP_BASE}${s.backdrop_path}` : null,
                releaseDate: s.first_air_date || null,
                releaseYear: s.first_air_date ? s.first_air_date.slice(0, 4) : null,
                rating: parseFloat(s.vote_average) || 0,
                genres: (s.genre_ids || []),
                source: "tmdb",
            }));
            setCache(cacheKey, results, SIX_HOURS);
            return results;
        }
        catch (e) {
            console.error("[tmdb.service] getUpcomingSeries error:", e.message);
            return [];
        }
    });
}
