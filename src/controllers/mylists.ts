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

/* GET OR CREATE USER'S LIST */
async function getOrCreateList(userId: string) {
  let list = await db.myList.findUnique({
    where: { userId },
  });

  if (!list) {
    list = await db.myList.create({
      data: { userId },
    });
  }

  return list;
}

/* ADD TO MY LIST */
export async function addToMyList(req: Request, res: Response) {
  const { userId, movieId, seriesId } = req.body;

  try {
    // Validation
    if (!userId) {
      return res.status(400).json({ data: null, error: "User ID is required" });
    }

    if (!movieId && !seriesId) {
      return res.status(400).json({
        data: null,
        error: "Either movieId or seriesId is required",
      });
    }

    if (movieId && seriesId) {
      return res.status(400).json({
        data: null,
        error: "Cannot add both movie and series at once",
      });
    }

    // Get or create the user's list
    const list = await getOrCreateList(userId);

    if (movieId) {
      // Check if movie exists
      const movieExists = await db.movie.findUnique({
        where: { id: movieId },
      });
      if (!movieExists) {
        return res.status(404).json({ data: null, error: "Movie not found" });
      }

      // Check if already in list
      const existing = await db.myListMovie.findUnique({
        where: {
          listId_movieId: {
            listId: list.id,
            movieId,
          },
        },
      });

      if (existing) {
        return res.status(409).json({
          data: null,
          error: "Movie is already in your list",
        });
      }

      // Add to list
      const listItem = await db.myListMovie.create({
        data: {
          listId: list.id,
          movieId,
        },
        include: {
          movie: {
            include: {
              vj: true,
              genre: true,
              year: true,
            },
          },
        },
      });

      console.log(`✅ Added movie to list: User ${userId} - Movie ${movieId}`);

      return res.status(201).json({
        data: serializeBigInt(listItem),
        error: null,
        message: "Movie added to your list",
      });
    }

    if (seriesId) {
      // Check if series exists
      const seriesExists = await db.series.findUnique({
        where: { id: seriesId },
      });
      if (!seriesExists) {
        return res.status(404).json({ data: null, error: "Series not found" });
      }

      // Check if already in list
      const existing = await db.myListSeries.findUnique({
        where: {
          listId_seriesId: {
            listId: list.id,
            seriesId,
          },
        },
      });

      if (existing) {
        return res.status(409).json({
          data: null,
          error: "Series is already in your list",
        });
      }

      // Add to list
      const listItem = await db.myListSeries.create({
        data: {
          listId: list.id,
          seriesId,
        },
        include: {
          series: {
            include: {
              vj: true,
              genre: true,
              year: true,
            },
          },
        },
      });

      console.log(`✅ Added series to list: User ${userId} - Series ${seriesId}`);

      return res.status(201).json({
        data: serializeBigInt(listItem),
        error: null,
        message: "Series added to your list",
      });
    }
  } catch (error: any) {
    console.error("Error adding to my list:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return res.status(409).json({
        data: null,
        error: "This item is already in your list",
      });
    }

    return res.status(500).json({
      data: null,
      error: "Failed to add to list",
    });
  }
}

/* REMOVE FROM MY LIST */
export async function removeFromMyList(req: Request, res: Response) {
  const { userId, movieId, seriesId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ data: null, error: "User ID is required" });
    }

    if (!movieId && !seriesId) {
      return res.status(400).json({
        data: null,
        error: "Either movieId or seriesId is required",
      });
    }

    // Get user's list
    const list = await db.myList.findUnique({
      where: { userId },
    });

    if (!list) {
      return res.status(404).json({
        data: null,
        error: "List not found",
      });
    }

    if (movieId) {
      const deleted = await db.myListMovie.deleteMany({
        where: {
          listId: list.id,
          movieId,
        },
      });

      if (deleted.count === 0) {
        return res.status(404).json({
          data: null,
          error: "Movie not found in your list",
        });
      }

      console.log(`✅ Removed movie from list: User ${userId} - Movie ${movieId}`);
    }

    if (seriesId) {
      const deleted = await db.myListSeries.deleteMany({
        where: {
          listId: list.id,
          seriesId,
        },
      });

      if (deleted.count === 0) {
        return res.status(404).json({
          data: null,
          error: "Series not found in your list",
        });
      }

      console.log(`✅ Removed series from list: User ${userId} - Series ${seriesId}`);
    }

    return res.status(200).json({
      data: null,
      message: "Removed from your list",
    });
  } catch (error) {
    console.error("Error removing from my list:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to remove from list",
    });
  }
}

/* GET MY LIST */
export async function getMyList(req: Request, res: Response) {
  const { userId } = req.params;
  const { type } = req.query; // 'movies', 'series', or undefined for all

  try {
    if (!userId) {
      return res.status(400).json({ data: null, error: "User ID is required" });
    }

    // Get or create list
    const list = await getOrCreateList(userId);

    const includeMovies = !type || type === "movies";
    const includeSeries = !type || type === "series";

    const listWithItems = await db.myList.findUnique({
      where: { id: list.id },
      include: {
        movies: includeMovies
          ? {
              include: {
                movie: {
                  include: {
                    vj: true,
                    genre: true,
                    year: true,
                  },
                },
              },
              orderBy: { addedAt: "desc" },
            }
          : false,
        series: includeSeries
          ? {
              include: {
                series: {
                  include: {
                    vj: true,
                    genre: true,
                    year: true,
                  },
                },
              },
              orderBy: { addedAt: "desc" },
            }
          : false,
      },
    });

    return res.status(200).json({
      data: serializeBigInt(listWithItems),
      error: null,
    });
  } catch (error) {
    console.error("Error fetching my list:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch list" });
  }
}

/* CHECK IF IN MY LIST */
export async function checkInMyList(req: Request, res: Response) {
  const { userId, movieId, seriesId } = req.query;

  try {
    if (!userId) {
      return res.status(400).json({ data: null, error: "User ID is required" });
    }

    // Get user's list
    const list = await db.myList.findUnique({
      where: { userId: userId as string },
    });

    if (!list) {
      return res.status(200).json({
        data: { inList: false },
        error: null,
      });
    }

    let inList = false;

    if (movieId) {
      const item = await db.myListMovie.findUnique({
        where: {
          listId_movieId: {
            listId: list.id,
            movieId: movieId as string,
          },
        },
      });
      inList = !!item;
    }

    if (seriesId) {
      const item = await db.myListSeries.findUnique({
        where: {
          listId_seriesId: {
            listId: list.id,
            seriesId: seriesId as string,
          },
        },
      });
      inList = !!item;
    }

    return res.status(200).json({
      data: { inList },
      error: null,
    });
  } catch (error) {
    console.error("Error checking my list:", error);
    return res.status(500).json({ data: null, error: "Failed to check list" });
  }
}

/* GET MY LIST STATS */
export async function getMyListStats(req: Request, res: Response) {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({ data: null, error: "User ID is required" });
    }

    // Get or create list
    const list = await getOrCreateList(userId);

    const [totalMovies, totalSeries] = await Promise.all([
      db.myListMovie.count({
        where: { listId: list.id },
      }),
      db.myListSeries.count({
        where: { listId: list.id },
      }),
    ]);

    return res.status(200).json({
      data: {
        totalMovies,
        totalSeries,
        total: totalMovies + totalSeries,
      },
      error: null,
    });
  } catch (error) {
    console.error("Error fetching my list stats:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch stats" });
  }
}