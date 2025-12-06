import express from "express";
import {
  createMovie,
  getAllMovies,
  getMovieById,
  getMovieBySlug,
  updateMovie,
  deleteMovie,
  incrementViewCount,
  getTrendingMovies,
  getComingSoonMovies,
} from "@/controllers/movies";

const movieRouter = express.Router();

// Public routes
movieRouter.get("/movies", getAllMovies);
movieRouter.get("/movies/trending", getTrendingMovies);
movieRouter.get("/movies/coming-soon", getComingSoonMovies);
movieRouter.get("/movies/:id", getMovieById);
movieRouter.get("/movies/slug/:slug", getMovieBySlug);
movieRouter.post("/movies/:id/view", incrementViewCount);

// Admin routes (no auth for now)
movieRouter.post("/movies", createMovie);
movieRouter.put("/movies/:id", updateMovie);
movieRouter.delete("/movies/:id", deleteMovie);

export default movieRouter;