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

/* ── POST /api/v1/metadata/import-series/:seriesId
   Fetches all seasons + episodes from TMDB and creates them in the DB.
   Episodes are created WITHOUT videoUrl (admin uploads videos later).
   Body: { tmdbSeriesId: number, seriesPoster: string }
── */
export async function importSeriesFromTmdb(req: Request, res: Response) {
  const { seriesId } = req.params;
  const { tmdbSeriesId, seriesPoster } = req.body;

  if (!tmdbSeriesId || isNaN(parseInt(tmdbSeriesId))) {
    return res.status(400).json({ success: false, error: "tmdbSeriesId is required" });
  }

  try {
    // 1. Get series details to know total seasons
    const { getSeriesDetails } = await import("@/services/metadata/tmdb.service");
    const seriesDetails = await getSeriesDetails(parseInt(tmdbSeriesId));
    if (!seriesDetails) {
      return res.status(404).json({ success: false, error: "Series not found on TMDB" });
    }

    const totalSeasons = seriesDetails.totalSeasons || 0;
    if (totalSeasons === 0) {
      return res.status(200).json({ success: true, data: { seasonsCreated: 0, episodesCreated: 0 } });
    }

    let seasonsCreated = 0;
    let episodesCreated = 0;
    const errors: string[] = [];

    // 2. Fetch and create each season
    for (let sNum = 1; sNum <= totalSeasons; sNum++) {
      try {
        const { getTmdbSeasonDetails } = await import("@/services/metadata/tmdb-series.service");
        const seasonData = await getTmdbSeasonDetails(parseInt(tmdbSeriesId), sNum);
        if (!seasonData) continue;

        // Check if season already exists
        const existingSeason = await db.season.findFirst({
          where: { seriesId, seasonNumber: sNum },
        });

        let seasonId: string;

        if (existingSeason) {
          seasonId = existingSeason.id;
        } else {
          const newSeason = await db.season.create({
            data: {
              seriesId,
              seasonNumber: sNum,
              title: seasonData.title || `Season ${sNum}`,
              description: seasonData.description || undefined,
              poster: seriesPoster || undefined,  // always use series poster
              releaseYear: seasonData.releaseYear || undefined,
              totalEpisodes: seasonData.episodes.length,
            },
          });
          seasonId = newSeason.id;
          seasonsCreated++;

          // Update series totalSeasons
          await db.series.update({
            where: { id: seriesId },
            data: { totalSeasons: { increment: 1 } },
          });
        }

        // 3. Create episodes for this season
        for (const ep of seasonData.episodes) {
          try {
            const existing = await db.episode.findFirst({
              where: { seasonId, episodeNumber: ep.episodeNumber },
            });
            if (existing) continue;

            await db.episode.create({
              data: {
                seasonId,
                episodeNumber: ep.episodeNumber,
                title: ep.title || `Episode ${ep.episodeNumber}`,
                description: ep.description || undefined,
                videoUrl: "",  // placeholder — admin uploads later
                poster: seriesPoster || undefined,  // series poster
                length: ep.length || undefined,
                lengthSeconds: ep.lengthSeconds || undefined,
                releaseDate: ep.releaseDate ? new Date(ep.releaseDate) : undefined,
              },
            });
            episodesCreated++;
          } catch (epErr: any) {
            errors.push(`S${sNum}E${ep.episodeNumber}: ${epErr.message}`);
          }
        }

        // Update season episode count
        await db.season.update({
          where: { id: seasonId },
          data: { totalEpisodes: seasonData.episodes.length },
        });

      } catch (sErr: any) {
        errors.push(`Season ${sNum}: ${sErr.message}`);
      }
    }

    // Update series total episodes
    const totalEps = await db.episode.count({ where: { season: { seriesId } } });
    await db.series.update({
      where: { id: seriesId },
      data: { totalEpisodes: totalEps },
    });

    return res.status(200).json({
      success: true,
      data: { seasonsCreated, episodesCreated, errors },
      message: `Created ${seasonsCreated} seasons and ${episodesCreated} episodes`,
    });
  } catch (e: any) {
    console.error("[metadata.controller] importSeriesFromTmdb error:", e.message);
    return res.status(500).json({ success: false, error: e.message || "Import failed" });
  }
}
