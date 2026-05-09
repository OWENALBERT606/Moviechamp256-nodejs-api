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
exports.getOmdbData = getOmdbData;
const axios_1 = __importDefault(require("axios"));
const OMDB_API_KEY = process.env.OMDB_API_KEY || "";
const OMDB_BASE = "https://www.omdbapi.com";
function getOmdbData() {
    return __awaiter(this, arguments, void 0, function* (imdbId = null, title = null, year = null) {
        try {
            const params = { apikey: OMDB_API_KEY };
            if (imdbId) {
                params.i = imdbId;
            }
            else if (title) {
                params.t = title;
                if (year)
                    params.y = year;
            }
            else {
                return null;
            }
            const res = yield axios_1.default.get(OMDB_BASE, { params, timeout: 6000 });
            const data = res.data;
            if (data.Response === "False")
                return null;
            const rating = parseFloat(data.imdbRating);
            if (isNaN(rating))
                return null;
            return {
                imdbRating: rating,
                imdbId: data.imdbID || imdbId || "",
            };
        }
        catch (e) {
            console.error("[omdb.service] getOmdbData error:", e.message);
            return null;
        }
    });
}
