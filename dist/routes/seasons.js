"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const series_1 = require("../controllers/series");
const seasonRouter = express_1.default.Router();
seasonRouter.get("/series/:seriesId/seasons", series_1.getSeasonsBySeriesId);
seasonRouter.get("/seasons/:id", series_1.getSeasonById);
seasonRouter.post("/series/:seriesId/seasons", series_1.createSeason);
seasonRouter.put("/seasons/:id", series_1.updateSeason);
seasonRouter.delete("/seasons/:id", series_1.deleteSeason);
exports.default = seasonRouter;
