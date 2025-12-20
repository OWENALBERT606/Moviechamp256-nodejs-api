import { clearWatchHistory, deleteWatchHistoryItem, getContinueWatching, getWatchHistory, getWatchProgress, updateWatchProgress } from "@/controllers/wathchistory";
import express from "express";


const watchHistoryRouter = express.Router();

// Get user's watch history
watchHistoryRouter.get("/watchhistory/:userId", getWatchHistory);

// Get continue watching items
watchHistoryRouter.get("/watchhistory/:userId/continue", getContinueWatching);

// Get watch progress for specific item
watchHistoryRouter.get("/watchhistory/progress", getWatchProgress);

// Update watch progress
watchHistoryRouter.post("/watchhistory", updateWatchProgress);

// Delete specific watch history item
watchHistoryRouter.delete("/watchhistory/:id", deleteWatchHistoryItem);

// Clear all watch history for user
watchHistoryRouter.delete("/watchhistory/:userId/clear", clearWatchHistory);

export default watchHistoryRouter;