import express from "express";
import {
  searchMovie,
  searchSeries,
  enrichMovie,
  enrichSeries,
} from "@/controllers/metadata.controller";

const metadataRouter = express.Router();

// No auth required — these endpoints only proxy external APIs (TMDB/OMDB/YouTube)
// and return no sensitive user data. Auth is enforced at the create/update movie level.
metadataRouter.get("/metadata/search/movie",          searchMovie);
metadataRouter.get("/metadata/search/series",         searchSeries);
metadataRouter.get("/metadata/enrich/movie/:tmdbId",  enrichMovie);
metadataRouter.get("/metadata/enrich/series/:tmdbId", enrichSeries);

export default metadataRouter;
