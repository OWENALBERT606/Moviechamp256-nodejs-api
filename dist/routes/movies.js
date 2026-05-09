"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const movies_1 = require("../controllers/movies");
const movieRouter = express_1.default.Router();
movieRouter.get("/movies", movies_1.getAllMovies);
movieRouter.get("/movies/trending", movies_1.getTrendingMovies);
movieRouter.get("/movies/coming-soon", movies_1.getComingSoonMovies);
movieRouter.get("/movies/:id", movies_1.getMovieById);
movieRouter.get("/movies/slug/:slug", movies_1.getMovieBySlug);
movieRouter.post("/movies/:id/view", movies_1.incrementViewCount);
movieRouter.post("/movies", movies_1.createMovie);
movieRouter.put("/movies/:id", movies_1.updateMovie);
movieRouter.delete("/movies/:id", movies_1.deleteMovie);
exports.default = movieRouter;
