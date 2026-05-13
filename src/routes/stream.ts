import { Router, Response, NextFunction } from "express";
import { authenticateToken, AuthRequest } from "@/utils/auth";
import { db } from "@/db/db";
import { generateSignedUrl } from "@/utils/signed-url";
import { extractR2Key } from "@/services/r2-delete";
import { withCache } from "@/utils/cache";
import jwt from "jsonwebtoken";

const streamRouter = Router();

/**
 * Optional authentication middleware
 */
const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded as any;
    }
    next();
  });
};

streamRouter.get("/stream/:movieId", optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  const { movieId } = req.params;
  const userId = req.user?.userId || "guest";

  try {
    const movie = await withCache(
      `movie:${movieId}`,
      3600,
      () => db.movie.findUnique({
        where: { id: movieId },
        select: { videoUrl: true },
      })
    );

    if (!movie) {
      return res.status(404).json({ data: null, error: "Movie not found" });
    }
    if (!movie.videoUrl) {
      return res.status(404).json({ data: null, error: "No video available for this movie" });
    }

    const key = extractR2Key(movie.videoUrl);
    if (!key) {
      return res.status(500).json({ data: null, error: "Could not resolve video path" });
    }

    const url = await withCache(
      `stream-url:${userId}:${movieId}`,
      3000,
      async () => generateSignedUrl(key)
    );

    return res.json({ data: { url }, error: null });
  } catch (error) {
    console.error("Error generating stream URL:", error);
    return res.status(500).json({ data: null, error: "Failed to generate stream URL" });
  }
});

export default streamRouter;
