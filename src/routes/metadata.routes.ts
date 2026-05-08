import express from "express";
import {
  searchMovie,
  searchSeries,
  enrichMovie,
  enrichSeries,
  enrichSeason,
  enrichEpisode,
  upcomingMovies,
  upcomingSeries,
} from "@/controllers/metadata.controller";

const metadataRouter = express.Router();

metadataRouter.get("/metadata/search/movie",                                       searchMovie);
metadataRouter.get("/metadata/search/series",                                      searchSeries);
metadataRouter.get("/metadata/enrich/movie/:tmdbId",                               enrichMovie);
metadataRouter.get("/metadata/enrich/series/:tmdbId",                              enrichSeries);
metadataRouter.get("/metadata/season/:tmdbSeriesId/:seasonNumber",                 enrichSeason);
metadataRouter.get("/metadata/episode/:tmdbSeriesId/:seasonNumber/:episodeNumber", enrichEpisode);
metadataRouter.get("/metadata/upcoming/movies",                                    upcomingMovies);
metadataRouter.get("/metadata/upcoming/series",                                    upcomingSeries);

export default metadataRouter;
