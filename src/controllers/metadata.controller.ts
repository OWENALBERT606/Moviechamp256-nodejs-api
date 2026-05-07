import { Request, Response } from "express";
import { db } from "@/db/db";
import {
  fetchMovieMetadata,
  enrichMovieById,
  fetchSeriesMetadata,
  enrichSeriesById,
} from "@/services/metadata/metadata.service";

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
