import express from "express";
import {
  createSeason,
  getSeasonsBySeriesId,
  getSeasonById,
  updateSeason,
  deleteSeason,
} from "@/controllers/series";

const seasonRouter = express.Router();

// Get all seasons for a series
seasonRouter.get("/series/:seriesId/seasons", getSeasonsBySeriesId);

// Get season by ID
seasonRouter.get("/seasons/:id", getSeasonById);

// Create season for a series
seasonRouter.post("/series/:seriesId/seasons", createSeason);

// Update season
seasonRouter.put("/seasons/:id", updateSeason);

// Delete season
seasonRouter.delete("/seasons/:id", deleteSeason);

export default seasonRouter;