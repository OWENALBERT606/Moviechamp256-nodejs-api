// import express from "express";
// import {
//   createGenre,
//   getAllGenres,
//   getGenreById,
//   getGenreBySlug,
//   updateGenre,
//   deleteGenre,
// } from "@/controllers/genres";
// import { authenticateToken } from "@/utils/auth";

// const genreRouter = express.Router();

// // Public routes (anyone can view genres)
// genreRouter.get("/genres", getAllGenres);
// genreRouter.get("/genres/:id", getGenreById);
// genreRouter.get("/genres/slug/:slug", getGenreBySlug);

// // Protected routes (require authentication)
// genreRouter.post("/genres", authenticateToken, createGenre);
// genreRouter.put("/genres/:id", authenticateToken, updateGenre);
// genreRouter.delete("/genres/:id", authenticateToken, deleteGenre);

// export default genreRouter;


// src/routes/genres.ts
import express from "express";
import {
  createGenre,
  getAllGenres,
  getGenreById,
  getGenreBySlug,
  updateGenre,
  deleteGenre,
} from "@/controllers/genres";

const genreRouter = express.Router();

// All routes are public - no authentication required
genreRouter.get("/genres", getAllGenres);
genreRouter.get("/genres/:id", getGenreById);
genreRouter.get("/genres/slug/:slug", getGenreBySlug);
genreRouter.post("/genres", createGenre);
genreRouter.put("/genres/:id", updateGenre);
genreRouter.delete("/genres/:id", deleteGenre);

export default genreRouter;