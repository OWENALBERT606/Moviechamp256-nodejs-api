// src/controllers/watchHistory.ts
import { db } from "@/db/db";
import { Request, Response } from "express";

/* ======================
   UPDATE WATCH PROGRESS
====================== */
export async function updateWatchProgress(req: Request, res: Response) {
  const { movieId } = req.params;
  const { userId, currentTime, duration } = req.body as {
    userId: string;
    currentTime: number;
    duration: number;
  };

  if (!userId) {
    return res.status(400).json({ data: null, error: "User ID is required" });
  }

  try {
    // Calculate progress percentage
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    // Consider completed if watched > 90%
    const completed = progressPercent >= 90;

    const watchHistory = await db.watchHistory.upsert({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
      update: {
        currentTime,
        duration,
        progressPercent,
        completed,
        lastWatchedAt: new Date(),
      },
      create: {
        userId,
        movieId,
        currentTime,
        duration,
        progressPercent,
        completed,
      },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            poster: true,
            lengthSeconds: true,
          },
        },
      },
    });

    return res.status(200).json({ data: watchHistory, error: null });
  } catch (error) {
    console.error("Error updating watch progress:", error);
    return res.status(500).json({ data: null, error: "Failed to update progress" });
  }
}

/* ======================
   GET CONTINUE WATCHING
====================== */
export async function getContinueWatching(req: Request, res: Response) {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ data: null, error: "User ID is required" });
  }

  try {
    const continueWatching = await db.watchHistory.findMany({
      where: {
        userId,
        completed: false,
        progressPercent: { gt: 0 },
      },
      orderBy: {
        lastWatchedAt: "desc",
      },
      take: 10,
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            poster: true,
            trailerPoster: true,
            rating: true,
            lengthSeconds: true,
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
        },
      },
    });

    return res.status(200).json({ data: continueWatching, error: null });
  } catch (error) {
    console.error("Error fetching continue watching:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch continue watching" });
  }
}

/* ======================
   GET WATCH HISTORY
====================== */
export async function getWatchHistory(req: Request, res: Response) {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ data: null, error: "User ID is required" });
  }

  try {
    const history = await db.watchHistory.findMany({
      where: { userId },
      orderBy: {
        lastWatchedAt: "desc",
      },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            poster: true,
            lengthSeconds: true,
            rating: true,
          },
        },
      },
    });

    return res.status(200).json({ data: history, error: null });
  } catch (error) {
    console.error("Error fetching watch history:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch watch history" });
  }
}

/* ======================
   DELETE WATCH HISTORY
====================== */
export async function deleteWatchHistory(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const watchHistory = await db.watchHistory.findUnique({
      where: { id },
    });

    if (!watchHistory) {
      return res.status(404).json({ data: null, error: "Watch history not found" });
    }

    await db.watchHistory.delete({ where: { id } });

    return res.status(200).json({
      data: null,
      message: "Watch history deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting watch history:", error);
    return res.status(500).json({ data: null, error: "Failed to delete watch history" });
  }
}