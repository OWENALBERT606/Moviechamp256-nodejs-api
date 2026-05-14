import { Request, Response } from "express";
import { db } from "@/db/db";
import { AuthRequest } from "@/utils/auth";

/**
 * Check if a user can download a movie/episode/documentary
 * Free tier users are limited to 2 downloads per 24 hours.
 */
export async function checkDownloadLimit(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ data: null, error: "Unauthorized" });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        currentPlan: true,
        planExpiresAt: true,
        isExempt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ data: null, error: "User not found" });
    }

    const isPaidPlan = user.currentPlan && user.planExpiresAt && user.planExpiresAt > new Date();

    // Exempt users have unlimited downloads
    if (user.isExempt) {
      return res.status(200).json({ data: { canDownload: true, remainingDownloads: null, limit: null }, error: null });
    }

    const dailyLimit = isPaidPlan ? 3 : 1;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const downloadCount = await db.downloadEvent.count({
      where: { userId, createdAt: { gte: since } },
    });

    return res.status(200).json({
      data: {
        canDownload: downloadCount < dailyLimit,
        remainingDownloads: Math.max(0, dailyLimit - downloadCount),
        limit: dailyLimit,
        isPaidPlan: !!isPaidPlan,
      },
      error: null,
    });
  } catch (error) {
    console.error("Error checking download limit:", error);
    return res.status(500).json({ data: null, error: "Failed to check download limit" });
  }
}

/**
 * Record a download event
 */
export async function recordDownload(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { movieId, seriesId, episodeId, docId } = req.body;

  if (!userId) {
    return res.status(401).json({ data: null, error: "Unauthorized" });
  }

  try {
    // Record the event
    const event = await db.downloadEvent.create({
      data: {
        userId,
        movieId: movieId || null,
        seriesId: seriesId || null,
        episodeId: episodeId || null,
        docId: docId || null,
      },
    });

    return res.status(201).json({ data: event, error: null });
  } catch (error) {
    console.error("Error recording download:", error);
    return res.status(500).json({ data: null, error: "Failed to record download" });
  }
}
