import express from "express";
import { authenticateToken } from "@/utils/auth";
import {
  searchMovie,
  searchSeries,
  enrichMovie,
  enrichSeries,
} from "@/controllers/metadata.controller";

const metadataRouter = express.Router();

// All metadata endpoints require authentication
metadataRouter.use(authenticateToken as any);

metadataRouter.get("/metadata/search/movie",    searchMovie);
metadataRouter.get("/metadata/search/series",   searchSeries);
metadataRouter.get("/metadata/enrich/movie/:tmdbId",  enrichMovie);
metadataRouter.get("/metadata/enrich/series/:tmdbId", enrichSeries);

export default metadataRouter;
