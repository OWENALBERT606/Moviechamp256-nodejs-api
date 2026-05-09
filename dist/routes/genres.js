"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const genres_1 = require("../controllers/genres");
const genreRouter = express_1.default.Router();
genreRouter.get("/genres", genres_1.getAllGenres);
genreRouter.get("/genres/:id", genres_1.getGenreById);
genreRouter.get("/genres/slug/:slug", genres_1.getGenreBySlug);
genreRouter.post("/genres", genres_1.createGenre);
genreRouter.put("/genres/:id", genres_1.updateGenre);
genreRouter.delete("/genres/:id", genres_1.deleteGenre);
exports.default = genreRouter;
