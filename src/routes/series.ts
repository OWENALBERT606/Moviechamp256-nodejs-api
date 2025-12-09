import express from "express";
import {
  createSeries,
  getAllSeries,
  getSeriesById,
  getSeriesBySlug,
  updateSeries,
  deleteSeries,
  incrementSeriesViewCount,
  getTrendingSeries,
  getComingSoonSeries,
} from "@/controllers/series";

const seriesRouter = express.Router();

// Public routes - anyone can view series
seriesRouter.get("/series", getAllSeries);
seriesRouter.get("/series/trending", getTrendingSeries);
seriesRouter.get("/series/coming-soon", getComingSoonSeries);
seriesRouter.get("/series/:id", getSeriesById);
seriesRouter.get("/series/slug/:slug", getSeriesBySlug);
seriesRouter.post("/series/:id/view", incrementSeriesViewCount);

// CRUD routes - no authentication required
seriesRouter.post("/series", createSeries);
seriesRouter.put("/series/:id", updateSeries);
seriesRouter.delete("/series/:id", deleteSeries);

export default seriesRouter;