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
exports.fetchMovieMetadata = fetchMovieMetadata;
exports.enrichMovieById = enrichMovieById;
exports.fetchSeriesMetadata = fetchSeriesMetadata;
exports.enrichSeriesById = enrichSeriesById;
const slugify_1 = __importDefault(require("slugify"));
const tmdb_service_1 = require("./tmdb.service");
const omdb_service_1 = require("./omdb.service");
const trailer_service_1 = require("./trailer.service");
const genre_resolver_1 = require("./genre.resolver");
const year_resolver_1 = require("./year.resolver");
function generateUniqueSlug(title_1, prisma_1) {
    return __awaiter(this, arguments, void 0, function* (title, prisma, model = "movie") {
        let slug = (0, slugify_1.default)(title, { lower: true, strict: true });
        const existing = model === "movie"
            ? yield prisma.movie.findUnique({ where: { slug } })
            : yield prisma.series.findUnique({ where: { slug } });
        if (existing)
            slug = `${slug}-${Date.now()}`;
        return slug;
    });
}
function fetchMovieMetadata(title) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, tmdb_service_1.searchMovies)(title);
    });
}
function enrichMovieById(tmdbId, prisma) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const tmdb = yield (0, tmdb_service_1.getMovieDetails)(tmdbId);
        if (!tmdb)
            throw new Error("TMDB movie not found");
        const [omdb, trailerResult] = yield Promise.all([
            (0, omdb_service_1.getOmdbData)(tmdb.imdbId, tmdb.title, tmdb.releaseYear),
            (0, trailer_service_1.resolveTrailer)({
                title: tmdb.title,
                year: tmdb.releaseYear,
                imdbId: tmdb.imdbId,
                tmdbTrailerKey: tmdb.tmdbTrailerKey,
            }),
        ]);
        const firstGenre = tmdb.genres[0] || null;
        const [genreId, yearId, slug] = yield Promise.all([
            firstGenre ? (0, genre_resolver_1.resolveGenre)(firstGenre, prisma) : Promise.resolve(null),
            (0, year_resolver_1.resolveYear)(tmdb.releaseDate, prisma),
            generateUniqueSlug(tmdb.title, prisma, "movie"),
        ]);
        const rating = (_a = omdb === null || omdb === void 0 ? void 0 : omdb.imdbRating) !== null && _a !== void 0 ? _a : tmdb.tmdbRating;
        const ratingSource = (omdb === null || omdb === void 0 ? void 0 : omdb.imdbRating) ? "imdb" : "tmdb";
        return {
            title: tmdb.title,
            description: tmdb.description,
            poster: tmdb.poster,
            image: tmdb.image,
            trailerPoster: tmdb.trailerPoster,
            director: tmdb.director,
            cast: tmdb.cast,
            rating,
            length: tmdb.length,
            lengthSeconds: tmdb.lengthSeconds,
            trailerUrl: trailerResult.url,
            isTrending: tmdb.isTrending,
            isComingSoon: tmdb.isComingSoon,
            genreId,
            yearId,
            slug,
            videoUrl: null,
            vjId: null,
            size: null,
            sizeBytes: null,
            downloadUrl: null,
            subtitles: null,
            _meta: {
                tmdbId: tmdb.tmdbId,
                imdbId: (_b = omdb === null || omdb === void 0 ? void 0 : omdb.imdbId) !== null && _b !== void 0 ? _b : tmdb.imdbId,
                posterOptions: tmdb.posterOptions,
                trailerSource: trailerResult.source,
                ratingSource,
            },
        };
    });
}
function fetchSeriesMetadata(title) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, tmdb_service_1.searchSeries)(title);
    });
}
function enrichSeriesById(tmdbId, prisma) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const tmdb = yield (0, tmdb_service_1.getSeriesDetails)(tmdbId);
        if (!tmdb)
            throw new Error("TMDB series not found");
        const [omdb, trailerResult] = yield Promise.all([
            (0, omdb_service_1.getOmdbData)(tmdb.imdbId, tmdb.title, tmdb.releaseYear),
            (0, trailer_service_1.resolveTrailer)({
                title: tmdb.title,
                year: tmdb.releaseYear,
                imdbId: tmdb.imdbId,
                tmdbTrailerKey: tmdb.tmdbTrailerKey,
            }),
        ]);
        const firstGenre = tmdb.genres[0] || null;
        const [genreId, yearId, slug] = yield Promise.all([
            firstGenre ? (0, genre_resolver_1.resolveGenre)(firstGenre, prisma) : Promise.resolve(null),
            (0, year_resolver_1.resolveYear)(tmdb.releaseDate, prisma),
            generateUniqueSlug(tmdb.title, prisma, "series"),
        ]);
        const rating = (_a = omdb === null || omdb === void 0 ? void 0 : omdb.imdbRating) !== null && _a !== void 0 ? _a : tmdb.tmdbRating;
        const ratingSource = (omdb === null || omdb === void 0 ? void 0 : omdb.imdbRating) ? "imdb" : "tmdb";
        return {
            title: tmdb.title,
            description: tmdb.description,
            poster: tmdb.poster,
            image: tmdb.image,
            trailerPoster: tmdb.trailerPoster,
            director: tmdb.director,
            cast: tmdb.cast,
            rating,
            trailerUrl: trailerResult.url,
            isTrending: tmdb.isTrending,
            isComingSoon: tmdb.isComingSoon,
            totalSeasons: tmdb.totalSeasons,
            totalEpisodes: tmdb.totalEpisodes,
            genreId,
            yearId,
            slug,
            vjId: null,
            downloadUrl: null,
            subtitles: null,
            _meta: {
                tmdbId: tmdb.tmdbId,
                imdbId: (_b = omdb === null || omdb === void 0 ? void 0 : omdb.imdbId) !== null && _b !== void 0 ? _b : tmdb.imdbId,
                posterOptions: tmdb.posterOptions,
                trailerSource: trailerResult.source,
                ratingSource,
            },
        };
    });
}
