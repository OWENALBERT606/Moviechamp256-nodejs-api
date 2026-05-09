"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const metadata_controller_1 = require("../controllers/metadata.controller");
const metadataRouter = express_1.default.Router();
metadataRouter.get("/metadata/search/movie", metadata_controller_1.searchMovie);
metadataRouter.get("/metadata/search/series", metadata_controller_1.searchSeries);
metadataRouter.get("/metadata/enrich/movie/:tmdbId", metadata_controller_1.enrichMovie);
metadataRouter.get("/metadata/enrich/series/:tmdbId", metadata_controller_1.enrichSeries);
metadataRouter.get("/metadata/season/:tmdbSeriesId/:seasonNumber", metadata_controller_1.enrichSeason);
metadataRouter.get("/metadata/episode/:tmdbSeriesId/:seasonNumber/:episodeNumber", metadata_controller_1.enrichEpisode);
metadataRouter.get("/metadata/upcoming/movies", metadata_controller_1.upcomingMovies);
metadataRouter.get("/metadata/upcoming/series", metadata_controller_1.upcomingSeries);
metadataRouter.post("/metadata/import-series/:seriesId", metadata_controller_1.importSeriesFromTmdb);
exports.default = metadataRouter;
