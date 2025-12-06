// src/routes/watchHistory.ts
import express from "express";
import {
  updateWatchProgress,
  getContinueWatching,
  getWatchHistory,
  deleteWatchHistory,
} from "@/controllers/watchHistory";

const watchHistoryRouter = express.Router();

// All routes are public - no authentication required
watchHistoryRouter.put("/watch-history/:movieId", updateWatchProgress);
watchHistoryRouter.get("/watch-history/continue-watching", getContinueWatching);
watchHistoryRouter.get("/watch-history", getWatchHistory);
watchHistoryRouter.delete("/watch-history/:id", deleteWatchHistory);

export default watchHistoryRouter;