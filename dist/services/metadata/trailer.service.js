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
exports.resolveTrailer = resolveTrailer;
const axios_1 = __importDefault(require("axios"));
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const YOUTUBE_SEARCH = "https://www.googleapis.com/youtube/v3/search";
function searchYouTube(query) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const res = yield axios_1.default.get(YOUTUBE_SEARCH, {
                params: {
                    part: "snippet",
                    type: "video",
                    maxResults: 1,
                    q: query,
                    key: YOUTUBE_API_KEY,
                },
                timeout: 6000,
            });
            const items = res.data.items || [];
            if (!items.length)
                return null;
            const videoId = (_b = (_a = items[0]) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.videoId;
            return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
        }
        catch (e) {
            console.error("[trailer.service] searchYouTube error:", e.message);
            return null;
        }
    });
}
function resolveTrailer(_a) {
    return __awaiter(this, arguments, void 0, function* ({ title, year, imdbId, tmdbTrailerKey, }) {
        if (imdbId && YOUTUBE_API_KEY) {
            try {
                const url = yield searchYouTube(`"${title}" ${year || ""} official trailer imdb`);
                if (url)
                    return { url, source: "imdb" };
            }
            catch (_b) { }
        }
        if (tmdbTrailerKey) {
            return {
                url: `https://www.youtube.com/watch?v=${tmdbTrailerKey}`,
                source: "tmdb",
            };
        }
        if (YOUTUBE_API_KEY) {
            try {
                const url = yield searchYouTube(`"${title}" ${year || ""} official trailer`);
                if (url)
                    return { url, source: "youtube" };
            }
            catch (_c) { }
        }
        return { url: null, source: "manual" };
    });
}
