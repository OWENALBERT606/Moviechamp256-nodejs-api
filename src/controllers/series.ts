import { db } from "@/db/db";
import { Request, Response } from "express";

/* Helper to serialize BigInt for JSON */
function serializeBigInt(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

/* Helper function to generate slug from title */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ======================
   SERIES CONTROLLERS
====================== */

/* CREATE SERIES */
export async function createSeries(req: Request, res: Response) {
  const {
    title,
    poster,
    trailerPoster,
    rating,
    vjId,
    genreId,
    yearId,
    description,
    director,
    cast,
    trailerUrl,
    isComingSoon,
    isTrending,
  } = req.body;

  try {
    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ data: null, error: "Series title is required" });
    }

    if (!vjId || !genreId || !yearId) {
      return res.status(400).json({ data: null, error: "VJ, Genre, and Year are required" });
    }

    const titleNorm = title.trim();
    const slug = generateSlug(titleNorm);

    // Check for existing series with same slug
    const existingSeries = await db.series.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingSeries) {
      return res.status(409).json({
        data: null,
        error: "Series with this title already exists",
      });
    }

    const newSeries = await db.series.create({
      data: {
        title: titleNorm,
        slug,
        poster: poster || "",
        trailerPoster: trailerPoster || "",
        rating: parseFloat(rating) || 0,
        vjId,
        genreId,
        yearId,
        description: description?.trim() || "",
        director: director?.trim() || "",
        cast: Array.isArray(cast) ? cast : [],
        trailerUrl: trailerUrl || "",
        isComingSoon: isComingSoon === true || isComingSoon === "true",
        isTrending: isTrending === true || isTrending === "true",
      },
      include: {
        vj: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        genre: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        year: {
          select: {
            id: true,
            value: true,
          },
        },
      },
    });

    return res.status(201).json({ data: serializeBigInt(newSeries), error: null });
  } catch (error) {
    console.error("Error creating series:", error);
    return res.status(500).json({ data: null, error: "Failed to create series" });
  }
}

/* GET ALL SERIES */
export async function getAllSeries(req: Request, res: Response) {
  try {
    const {
      page = "1",
      limit = "20",
      genreId,
      vjId,
      yearId,
      isTrending,
      isComingSoon,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (genreId) where.genreId = genreId;
    if (vjId) where.vjId = vjId;
    if (yearId) where.yearId = yearId;
    if (isTrending) where.isTrending = isTrending === "true";
    if (isComingSoon) where.isComingSoon = isComingSoon === "true";
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { director: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [series, total] = await Promise.all([
      db.series.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          vj: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          genre: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          year: {
            select: {
              id: true,
              value: true,
            },
          },
          _count: {
            select: {
              seasons: true,
            },
          },
        },
      }),
      db.series.count({ where }),
    ]);

    return res.status(200).json({
      data: serializeBigInt(series),
      error: null,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching series:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch series" });
  }
}

/* GET SERIES BY ID */
export async function getSeriesById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const series = await db.series.findUnique({
      where: { id },
      include: {
        vj: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
        genre: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        year: {
          select: {
            id: true,
            value: true,
          },
        },
        seasons: {
          include: {
            _count: {
              select: {
                episodes: true,
              },
            },
          },
          orderBy: {
            seasonNumber: "asc",
          },
        },
      },
    });

    if (!series) {
      return res.status(404).json({ data: null, error: "Series not found" });
    }

    return res.status(200).json({ data: serializeBigInt(series), error: null });
  } catch (error) {
    console.error("Error fetching series by id:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* GET SERIES BY SLUG */
export async function getSeriesBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  try {
    const series = await db.series.findUnique({
      where: { slug },
      include: {
        vj: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
        genre: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        year: {
          select: {
            id: true,
            value: true,
          },
        },
        seasons: {
          include: {
            _count: {
              select: {
                episodes: true,
              },
            },
          },
          orderBy: {
            seasonNumber: "asc",
          },
        },
      },
    });

    if (!series) {
      return res.status(404).json({ data: null, error: "Series not found" });
    }

    return res.status(200).json({ data: serializeBigInt(series), error: null });
  } catch (error) {
    console.error("Error fetching series by slug:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* UPDATE SERIES */
export async function updateSeries(req: Request, res: Response) {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const existingSeries = await db.series.findUnique({ where: { id } });
    if (!existingSeries) {
      return res.status(404).json({ data: null, error: "Series not found" });
    }

    // If updating title, regenerate slug
    let slug = existingSeries.slug;
    if (updateData.title && updateData.title.trim() !== existingSeries.title) {
      const titleNorm = updateData.title.trim();
      slug = generateSlug(titleNorm);

      const conflictSeries = await db.series.findFirst({
        where: {
          slug,
          NOT: { id },
        },
        select: { id: true },
      });

      if (conflictSeries) {
        return res.status(409).json({
          data: null,
          error: "Series with this title already exists",
        });
      }
    }

    // Build update object
    const data: any = { slug };

    if (updateData.title) data.title = updateData.title.trim();
    if (updateData.poster !== undefined) data.poster = updateData.poster;
    if (updateData.trailerPoster !== undefined) data.trailerPoster = updateData.trailerPoster;
    if (updateData.rating !== undefined) data.rating = parseFloat(updateData.rating);
    if (updateData.vjId) data.vjId = updateData.vjId;
    if (updateData.genreId) data.genreId = updateData.genreId;
    if (updateData.yearId) data.yearId = updateData.yearId;
    if (updateData.description !== undefined) data.description = updateData.description?.trim() || "";
    if (updateData.director !== undefined) data.director = updateData.director?.trim() || "";
    if (updateData.cast !== undefined) data.cast = Array.isArray(updateData.cast) ? updateData.cast : [];
    if (updateData.trailerUrl !== undefined) data.trailerUrl = updateData.trailerUrl;
    if (updateData.isComingSoon !== undefined) data.isComingSoon = updateData.isComingSoon === true || updateData.isComingSoon === "true";
    if (updateData.isTrending !== undefined) data.isTrending = updateData.isTrending === true || updateData.isTrending === "true";

    const updatedSeries = await db.series.update({
      where: { id },
      data,
      include: {
        vj: true,
        genre: true,
        year: true,
      },
    });

    return res.status(200).json({ data: serializeBigInt(updatedSeries), error: null });
  } catch (error) {
    console.error("Error updating series:", error);
    return res.status(500).json({ data: null, error: "Failed to update series" });
  }
}

/* DELETE SERIES */
export async function deleteSeries(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const existingSeries = await db.series.findUnique({
      where: { id },
    });

    if (!existingSeries) {
      return res.status(404).json({ data: null, error: "Series not found" });
    }

    await db.series.delete({ where: { id } });

    return res.status(200).json({
      data: null,
      message: "Series deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting series:", error);
    return res.status(500).json({ data: null, error: "Failed to delete series" });
  }
}

/* INCREMENT VIEW COUNT */
export async function incrementSeriesViewCount(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const series = await db.series.update({
      where: { id },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        viewsCount: true,
      },
    });

    return res.status(200).json({ data: serializeBigInt(series), error: null });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    return res.status(500).json({ data: null, error: "Failed to increment view count" });
  }
}

/* GET TRENDING SERIES */
export async function getTrendingSeries(req: Request, res: Response) {
  const { limit = "10" } = req.query;

  try {
    const series = await db.series.findMany({
      where: { isTrending: true },
      take: parseInt(limit as string),
      orderBy: { viewsCount: "desc" },
      include: {
        vj: true,
        genre: true,
        year: true,
      },
    });

    return res.status(200).json({ data: serializeBigInt(series), error: null });
  } catch (error) {
    console.error("Error fetching trending series:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch trending series" });
  }
}

/* GET COMING SOON SERIES */
export async function getComingSoonSeries(req: Request, res: Response) {
  const { limit = "10" } = req.query;

  try {
    const series = await db.series.findMany({
      where: { isComingSoon: true },
      take: parseInt(limit as string),
      orderBy: { createdAt: "desc" },
      include: {
        vj: true,
        genre: true,
        year: true,
      },
    });

    return res.status(200).json({ data: serializeBigInt(series), error: null });
  } catch (error) {
    console.error("Error fetching coming soon series:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch coming soon series" });
  }
}

/* ======================
   SEASON CONTROLLERS
====================== */

/* CREATE SEASON */
export async function createSeason(req: Request, res: Response) {
  const { seriesId } = req.params;
  const { seasonNumber, title, description, poster, trailerUrl, releaseYear } = req.body;

  try {
    // Validation
    if (!seasonNumber) {
      return res.status(400).json({ data: null, error: "Season number is required" });
    }

    // Check if series exists
    const series = await db.series.findUnique({
      where: { id: seriesId },
    });

    if (!series) {
      return res.status(404).json({ data: null, error: "Series not found" });
    }

    // Check if season already exists
    const existingSeason = await db.season.findFirst({
      where: {
        seriesId,
        seasonNumber: parseInt(seasonNumber),
      },
    });

    if (existingSeason) {
      return res.status(409).json({
        data: null,
        error: "Season with this number already exists for this series",
      });
    }

    const newSeason = await db.season.create({
      data: {
        seriesId,
        seasonNumber: parseInt(seasonNumber),
        title: title?.trim() || `Season ${seasonNumber}`,
        description: description?.trim() || null,
        poster: poster || null,
        trailerUrl: trailerUrl || null,
        releaseYear: releaseYear ? parseInt(releaseYear) : null,
      },
    });

    // Update series totalSeasons count
    await db.series.update({
      where: { id: seriesId },
      data: {
        totalSeasons: {
          increment: 1,
        },
      },
    });

    return res.status(201).json({ data: serializeBigInt(newSeason), error: null });
  } catch (error) {
    console.error("Error creating season:", error);
    return res.status(500).json({ data: null, error: "Failed to create season" });
  }
}

/* GET ALL SEASONS FOR A SERIES */
export async function getSeasonsBySeriesId(req: Request, res: Response) {
  const { seriesId } = req.params;

  try {
    const seasons = await db.season.findMany({
      where: { seriesId },
      orderBy: { seasonNumber: "asc" },
      include: {
        _count: {
          select: {
            episodes: true,
          },
        },
        series:true
      },
    });

    return res.status(200).json({ data: serializeBigInt(seasons), error: null });
  } catch (error) {
    console.error("Error fetching seasons:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch seasons" });
  }
}

/* GET SEASON BY ID */
export async function getSeasonById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const season = await db.season.findUnique({
      where: { id },
      include: {
        series: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
      },
    });

    if (!season) {
      return res.status(404).json({ data: null, error: "Season not found" });
    }

    return res.status(200).json({ data: serializeBigInt(season), error: null });
  } catch (error) {
    console.error("Error fetching season:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* UPDATE SEASON */
export async function updateSeason(req: Request, res: Response) {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const existingSeason = await db.season.findUnique({ where: { id } });
    if (!existingSeason) {
      return res.status(404).json({ data: null, error: "Season not found" });
    }

    const data: any = {};

    if (updateData.seasonNumber !== undefined) data.seasonNumber = parseInt(updateData.seasonNumber);
    if (updateData.title !== undefined) data.title = updateData.title?.trim() || null;
    if (updateData.description !== undefined) data.description = updateData.description?.trim() || null;
    if (updateData.poster !== undefined) data.poster = updateData.poster || null;
    if (updateData.trailerUrl !== undefined) data.trailerUrl = updateData.trailerUrl || null;
    if (updateData.releaseYear !== undefined) data.releaseYear = updateData.releaseYear ? parseInt(updateData.releaseYear) : null;

    const updatedSeason = await db.season.update({
      where: { id },
      data,
    });

    return res.status(200).json({ data: serializeBigInt(updatedSeason), error: null });
  } catch (error) {
    console.error("Error updating season:", error);
    return res.status(500).json({ data: null, error: "Failed to update season" });
  }
}

/* DELETE SEASON */
export async function deleteSeason(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const existingSeason = await db.season.findUnique({
      where: { id },
      select: { seriesId: true },
    });

    if (!existingSeason) {
      return res.status(404).json({ data: null, error: "Season not found" });
    }

    // Get episode count before deletion
    const episodeCount = await db.episode.count({
      where: { seasonId: id },
    });

    await db.season.delete({ where: { id } });

    // Update series counts
    await db.series.update({
      where: { id: existingSeason.seriesId },
      data: {
        totalSeasons: {
          decrement: 1,
        },
        totalEpisodes: {
          decrement: episodeCount,
        },
      },
    });

    return res.status(200).json({
      data: null,
      message: "Season deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting season:", error);
    return res.status(500).json({ data: null, error: "Failed to delete season" });
  }
}

/* ======================
   EPISODE CONTROLLERS
====================== */

/* CREATE EPISODE */
export async function createEpisode(req: Request, res: Response) {
  const { seasonId } = req.params;
  const {
    episodeNumber,
    title,
    description,
    videoUrl,
    poster,
    length,
    lengthSeconds,
    size,
    releaseDate,
  } = req.body;

  try {
    // Validation
    if (!episodeNumber || !title || !videoUrl) {
      return res.status(400).json({
        data: null,
        error: "Episode number, title, and video URL are required",
      });
    }

    // Check if season exists
    const season = await db.season.findUnique({
      where: { id: seasonId },
      select: { seriesId: true },
    });

    if (!season) {
      return res.status(404).json({ data: null, error: "Season not found" });
    }

    // Check if episode already exists
    const existingEpisode = await db.episode.findFirst({
      where: {
        seasonId,
        episodeNumber: parseInt(episodeNumber),
      },
    });

    if (existingEpisode) {
      return res.status(409).json({
        data: null,
        error: "Episode with this number already exists in this season",
      });
    }

    const newEpisode = await db.episode.create({
      data: {
        seasonId,
        episodeNumber: parseInt(episodeNumber),
        title: title.trim(),
        description: description?.trim() || null,
        videoUrl,
        poster: poster || null,
        length: length || null,
        lengthSeconds: lengthSeconds ? parseInt(lengthSeconds) : null,
        size: size || null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
      },
    });

    // Update season and series episode counts
    await Promise.all([
      db.season.update({
        where: { id: seasonId },
        data: {
          totalEpisodes: {
            increment: 1,
          },
        },
      }),
      db.series.update({
        where: { id: season.seriesId },
        data: {
          totalEpisodes: {
            increment: 1,
          },
        },
      }),
    ]);

    return res.status(201).json({ data: serializeBigInt(newEpisode), error: null });
  } catch (error) {
    console.error("Error creating episode:", error);
    return res.status(500).json({ data: null, error: "Failed to create episode" });
  }
}

/* GET ALL EPISODES FOR A SEASON */
export async function getEpisodesBySeasonId(req: Request, res: Response) {
  const { seasonId } = req.params;

  try {
    const episodes = await db.episode.findMany({
      where: { seasonId },
      orderBy: { episodeNumber: "asc" },
    });

    return res.status(200).json({ data: serializeBigInt(episodes), error: null });
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch episodes" });
  }
}

/* GET EPISODE BY ID */
export async function getEpisodeById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const episode = await db.episode.findUnique({
      where: { id },
      include: {
        season: {
          select: {
            id: true,
            seasonNumber: true,
            title: true,
            seriesId: true,
            series: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!episode) {
      return res.status(404).json({ data: null, error: "Episode not found" });
    }

    return res.status(200).json({ data: serializeBigInt(episode), error: null });
  } catch (error) {
    console.error("Error fetching episode:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* UPDATE EPISODE */
export async function updateEpisode(req: Request, res: Response) {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const existingEpisode = await db.episode.findUnique({ where: { id } });
    if (!existingEpisode) {
      return res.status(404).json({ data: null, error: "Episode not found" });
    }

    const data: any = {};

    if (updateData.episodeNumber !== undefined) data.episodeNumber = parseInt(updateData.episodeNumber);
    if (updateData.title !== undefined) data.title = updateData.title.trim();
    if (updateData.description !== undefined) data.description = updateData.description?.trim() || null;
    if (updateData.videoUrl !== undefined) data.videoUrl = updateData.videoUrl;
    if (updateData.poster !== undefined) data.poster = updateData.poster || null;
    if (updateData.length !== undefined) data.length = updateData.length || null;
    if (updateData.lengthSeconds !== undefined) data.lengthSeconds = updateData.lengthSeconds ? parseInt(updateData.lengthSeconds) : null;
    if (updateData.size !== undefined) data.size = updateData.size || null;
    if (updateData.releaseDate !== undefined) data.releaseDate = updateData.releaseDate ? new Date(updateData.releaseDate) : null;

    const updatedEpisode = await db.episode.update({
      where: { id },
      data,
    });

    return res.status(200).json({ data: serializeBigInt(updatedEpisode), error: null });
  } catch (error) {
    console.error("Error updating episode:", error);
    return res.status(500).json({ data: null, error: "Failed to update episode" });
  }
}

/* DELETE EPISODE */
export async function deleteEpisode(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const existingEpisode = await db.episode.findUnique({
      where: { id },
      select: {
        seasonId: true,
        season: {
          select: {
            seriesId: true,
          },
        },
      },
    });

    if (!existingEpisode) {
      return res.status(404).json({ data: null, error: "Episode not found" });
    }

    await db.episode.delete({ where: { id } });

    // Update season and series episode counts
    await Promise.all([
      db.season.update({
        where: { id: existingEpisode.seasonId },
        data: {
          totalEpisodes: {
            decrement: 1,
          },
        },
      }),
      db.series.update({
        where: { id: existingEpisode.season.seriesId },
        data: {
          totalEpisodes: {
            decrement: 1,
          },
        },
      }),
    ]);

    return res.status(200).json({
      data: null,
      message: "Episode deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting episode:", error);
    return res.status(500).json({ data: null, error: "Failed to delete episode" });
  }
}

/* INCREMENT EPISODE VIEW COUNT */
export async function incrementEpisodeViewCount(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const episode = await db.episode.update({
      where: { id },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        viewsCount: true,
        season: {
          select: {
            seriesId: true,
          },
        },
      },
    });

    // Also increment series view count
    await db.series.update({
      where: { id: episode.season.seriesId },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });

    return res.status(200).json({ data: serializeBigInt(episode), error: null });
  } catch (error) {
    console.error("Error incrementing episode view count:", error);
    return res.status(500).json({ data: null, error: "Failed to increment view count" });
  }
}

/* GET NEXT EPISODE */
export async function getNextEpisode(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const currentEpisode = await db.episode.findUnique({
      where: { id },
      select: {
        seasonId: true,
        episodeNumber: true,
        season: {
          select: {
            seriesId: true,
            seasonNumber: true,
          },
        },
      },
    });

    if (!currentEpisode) {
      return res.status(404).json({ data: null, error: "Episode not found" });
    }

    // Try to find next episode in same season
    let nextEpisode = await db.episode.findFirst({
      where: {
        seasonId: currentEpisode.seasonId,
        episodeNumber: {
          gt: currentEpisode.episodeNumber,
        },
      },
      orderBy: {
        episodeNumber: "asc",
      },
    });

    // If no next episode in current season, try first episode of next season
    if (!nextEpisode) {
      const nextSeason = await db.season.findFirst({
        where: {
          seriesId: currentEpisode.season.seriesId,
          seasonNumber: {
            gt: currentEpisode.season.seasonNumber,
          },
        },
        orderBy: {
          seasonNumber: "asc",
        },
      });

      if (nextSeason) {
        nextEpisode = await db.episode.findFirst({
          where: {
            seasonId: nextSeason.id,
          },
          orderBy: {
            episodeNumber: "asc",
          },
        });
      }
    }

    if (!nextEpisode) {
      return res.status(404).json({ data: null, error: "No next episode found" });
    }

    return res.status(200).json({ data: serializeBigInt(nextEpisode), error: null });
  } catch (error) {
    console.error("Error fetching next episode:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch next episode" });
  }
}

/* GET PREVIOUS EPISODE */
export async function getPreviousEpisode(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const currentEpisode = await db.episode.findUnique({
      where: { id },
      select: {
        seasonId: true,
        episodeNumber: true,
        season: {
          select: {
            seriesId: true,
            seasonNumber: true,
          },
        },
      },
    });

    if (!currentEpisode) {
      return res.status(404).json({ data: null, error: "Episode not found" });
    }

    // Try to find previous episode in same season
    let previousEpisode = await db.episode.findFirst({
      where: {
        seasonId: currentEpisode.seasonId,
        episodeNumber: {
          lt: currentEpisode.episodeNumber,
        },
      },
      orderBy: {
        episodeNumber: "desc",
      },
    });

    // If no previous episode in current season, try last episode of previous season
    if (!previousEpisode) {
      const previousSeason = await db.season.findFirst({
        where: {
          seriesId: currentEpisode.season.seriesId,
          seasonNumber: {
            lt: currentEpisode.season.seasonNumber,
          },
        },
        orderBy: {
          seasonNumber: "desc",
        },
      });

      if (previousSeason) {
        previousEpisode = await db.episode.findFirst({
          where: {
            seasonId: previousSeason.id,
          },
          orderBy: {
            episodeNumber: "desc",
          },
        });
      }
    }

    if (!previousEpisode) {
      return res.status(404).json({ data: null, error: "No previous episode found" });
    }

    return res.status(200).json({ data: serializeBigInt(previousEpisode), error: null });
  } catch (error) {
    console.error("Error fetching previous episode:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch previous episode" });
  }
}