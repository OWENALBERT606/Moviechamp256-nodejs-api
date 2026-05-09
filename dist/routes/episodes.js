"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const series_1 = require("../controllers/series");
const episodeRouter = express_1.default.Router();
episodeRouter.get("/seasons/:seasonId/episodes", series_1.getEpisodesBySeasonId);
episodeRouter.get("/episodes/:id", series_1.getEpisodeById);
episodeRouter.get("/episodes/:id/next", series_1.getNextEpisode);
episodeRouter.get("/episodes/:id/previous", series_1.getPreviousEpisode);
episodeRouter.post("/episodes/:id/view", series_1.incrementEpisodeViewCount);
episodeRouter.post("/seasons/:seasonId/episodes", series_1.createEpisode);
episodeRouter.put("/episodes/:id", series_1.updateEpisode);
episodeRouter.delete("/episodes/:id", series_1.deleteEpisode);
exports.default = episodeRouter;
