import { Request, Response } from "express";
import { db } from "@/db/db";
import {
  fetchMovieMetadata,
  enrichMovieById,
  fetchSeriesMetadata,
  enrichSeriesById,
} from "@/services/metadata/metadata.service";
import {
  getTmdbSeasonDetails,
  getTmdbEpisodeDetails,
} from "@/services/metadata/tmdb-series.service";
import {
  getUpcomingMovies,
  getUpcomingSeries,
} from "@/services/metadata/tmdb.service";

/* ── GET /api/v1/metadata/search/movie?title=Inception ── */
export async function searchMovie(req: Request, res: Response) {
  const { title } = req.query;
  if (!title || typeof title !== "string") {
    return res.status(400).json({ success: false, error: "title query param is required" });
  }

  try {
    const results = await fetchMovieMetadata(title.trim());
    return res.status(200).json({ success: true, data: results });
  } catch (e: any) {
    console.error("[metadata.controller] searchMovie error:", e.message);
    return res.status(500).json({ success: false, error: "Failed to search movies" });
  }
}

/* ── GET /api/v1/metadata/search/series?title=Breaking+Bad ── */
export async function searchSeries(req: Request, res: Response) {
  const { title } = req.query;
  if (!title || typeof title !== "string") {
    return res.status(400).json({ success: false, error: "title query param is required" });
  }

  try {
    const results = await fetchSeriesMetadata(title.trim());
    return res.status(200).json({ success: true, data: results });
  } catch (e: any) {
    console.error("[metadata.controller] searchSeries error:", e.message);
    return res.status(500).json({ success: false, error: "Failed to search series" });
  }
}

/* ── GET /api/v1/metadata/enrich/movie/:tmdbId ── */
export async function enrichMovie(req: Request, res: Response) {
  const tmdbId = parseInt(req.params.tmdbId);
  if (isNaN(tmdbId)) {
    return res.status(400).json({ success: false, error: "Invalid tmdbId" });
  }

  try {
    const data = await enrichMovieById(tmdbId, db);
    return res.status(200).json({ success: true, data });
  } catch (e: any) {
    console.error("[metadata.controller] enrichMovie error:", e.message);
    return res.status(500).json({ success: false, error: "Failed to enrich movie metadata" });
  }
}

/* ── GET /api/v1/metadata/enrich/series/:tmdbId ── */
export async function enrichSeries(req: Request, res: Response) {
  const tmdbId = parseInt(req.params.tmdbId);
  if (isNaN(tmdbId)) {
    return res.status(400).json({ success: false, error: "Invalid tmdbId" });
  }

  try {
    const data = await enrichSeriesById(tmdbId, db);
    return res.status(200).json({ success: true, data });
  } catch (e: any) {
    console.error("[metadata.controller] enrichSeries error:", e.message);
    return res.status(500).json({ success: false, error: "Failed to enrich series metadata" });
  }
}

/* ── GET /api/v1/metadata/season/:tmdbSeriesId/:seasonNumber ── */
export async function enrichSeason(req: Request, res: Response) {
  const tmdbSeriesId = parseInt(req.params.tmdbSeriesId);
  const seasonNumber = parseInt(req.params.seasonNumber);

  if (isNaN(tmdbSeriesId) || isNaN(seasonNumber)) {
    return res.status(400).json({ success: false, error: "Invalid tmdbSeriesId or seasonNumber" });
  }

  try {
    const data = await getTmdbSeasonDetails(tmdbSeriesId, seasonNumber);
    if (!data) return res.status(404).json({ success: false, error: "Season not found on TMDB" });
    return res.status(200).json({ success: true, data });
  } catch (e: any) {
    console.error("[metadata.controller] enrichSeason error:", e.message);
    return res.status(500).json({ success: false, error: "Failed to fetch season metadata" });
  }
}

/* ── GET /api/v1/metadata/episode/:tmdbSeriesId/:seasonNumber/:episodeNumber ── */
export async function enrichEpisode(req: Request, res: Response) {
  const tmdbSeriesId  = parseInt(req.params.tmdbSeriesId);
  const seasonNumber  = parseInt(req.params.seasonNumber);
  const episodeNumber = parseInt(req.params.episodeNumber);

  if (isNaN(tmdbSeriesId) || isNaN(seasonNumber) || isNaN(episodeNumber)) {
    return res.status(400).json({ success: false, error: "Invalid parameters" });
  }

  try {
    const data = await getTmdbEpisodeDetails(tmdbSeriesId, seasonNumber, episodeNumber);
    if (!data) return res.status(404).json({ success: false, error: "Episode not found on TMDB" });
    return res.status(200).json({ success: true, data });
  } catch (e: any) {
    console.error("[metadata.controller] enrichEpisode error:", e.message);
    return res.status(500).json({ success: false, error: "Failed to fetch episode metadata" });
  }
}

/* ── GET /api/v1/metadata/upcoming/movies?limit=20 ── */
export async function upcomingMovies(req: Request, res: Response) {
  const limit = parseInt((req.query.limit as string) || "20");
  try {
    const data = await getUpcomingMovies(limit);
    return res.status(200).json({ success: true, data });
  } catch (e: any) {
    console.error("[metadata.controller] upcomingMovies error:", e.message);
    return res.status(500).json({ success: false, error: "Failed to fetch upcoming movies" });
  }
}

/* ── GET /api/v1/metadata/upcoming/series?limit=20 ── */
export async function upcomingSeries(req: Request, res: Response) {
  const limit = parseInt((req.query.limit as string) || "20");
  try {
    const data = await getUpcomingSeries(limit);
    return res.status(200).json({ success: true, data });
  } catch (e: any) {
    console.error("[metadata.controller] upcomingSeries error:", e.message);
    return res.status(500).json({ success: false, error: "Failed to fetch upcoming series" });
  }
}
