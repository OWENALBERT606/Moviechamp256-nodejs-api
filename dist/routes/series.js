"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const series_1 = require("../controllers/series");
const seriesRouter = express_1.default.Router();
seriesRouter.get("/series/trending", series_1.getTrendingSeries);
seriesRouter.get("/series/coming-soon", series_1.getComingSoonSeries);
seriesRouter.get("/series/slug/:slug", series_1.getSeriesBySlug);
seriesRouter.get("/series", series_1.getAllSeries);
seriesRouter.get("/series/:id", series_1.getSeriesById);
seriesRouter.post("/series/:id/view", series_1.incrementSeriesViewCount);
seriesRouter.post("/series", series_1.createSeries);
seriesRouter.post("/series/:id/seasons", series_1.addSeasonsToSeries);
seriesRouter.put("/series/:id", series_1.updateSeries);
seriesRouter.delete("/series/:id", series_1.deleteSeries);
exports.default = seriesRouter;
