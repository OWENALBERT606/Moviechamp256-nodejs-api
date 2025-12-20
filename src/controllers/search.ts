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

/* GLOBAL SEARCH - Movies, Series, VJs, Genres */
export async function globalSearch(req: Request, res: Response) {
  const { q, limit = 20 } = req.query;

  try {
    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return res.status(400).json({ 
        data: null, 
        error: "Search query is required" 
      });
    }

    const searchTerm = q.trim().toLowerCase();

    // Search movies
    const movies = await db.movie.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { director: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      include: {
        vj: true,
        genre: true,
        year: true,
      },
      take: Number(limit),
    });

    // Search series
    const series = await db.series.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { director: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      include: {
        vj: true,
        genre: true,
        year: true,
      },
      take: Number(limit),
    });

    // Search VJs
    const vjs = await db.vJ.findMany({
      where: {
        name: { contains: searchTerm, mode: "insensitive" },
      },
      take: 5,
    });

    // Search Genres
    const genres = await db.genre.findMany({
      where: {
        name: { contains: searchTerm, mode: "insensitive" },
      },
      take: 5,
    });

    const results = {
      movies: serializeBigInt(movies),
      series: serializeBigInt(series),
      vjs: serializeBigInt(vjs),
      genres: serializeBigInt(genres),
      totalResults: movies.length + series.length + vjs.length + genres.length,
    };

    return res.status(200).json({
      data: results,
      error: null,
    });
  } catch (error) {
    console.error("Error performing global search:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to perform search",
    });
  }
}