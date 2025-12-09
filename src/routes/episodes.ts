import express from "express";
import {
  createEpisode,
  getEpisodesBySeasonId,
  getEpisodeById,
  updateEpisode,
  deleteEpisode,
  incrementEpisodeViewCount,
  getNextEpisode,
  getPreviousEpisode,
} from "@/controllers/series";

const episodeRouter = express.Router();

// Get all episodes for a season
episodeRouter.get("/seasons/:seasonId/episodes", getEpisodesBySeasonId);

// Get episode by ID
episodeRouter.get("/episodes/:id", getEpisodeById);

// Get next/previous episodes
episodeRouter.get("/episodes/:id/next", getNextEpisode);
episodeRouter.get("/episodes/:id/previous", getPreviousEpisode);

// Increment episode view count
episodeRouter.post("/episodes/:id/view", incrementEpisodeViewCount);

// Create episode for a season
episodeRouter.post("/seasons/:seasonId/episodes", createEpisode);

// Update episode
episodeRouter.put("/episodes/:id", updateEpisode);

// Delete episode
episodeRouter.delete("/episodes/:id", deleteEpisode);

export default episodeRouter;