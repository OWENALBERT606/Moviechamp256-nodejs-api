import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "@/utils/auth";
import { db } from "@/db/db";
import { generateSignedUrl } from "@/utils/signed-url";
import { extractR2Key } from "@/services/r2-delete";

const streamRouter = Router();

streamRouter.get("/stream/:movieId", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { movieId } = req.params;

  try {
    const movie = await db.movie.findUnique({
      where: { id: movieId },
      select: { videoUrl: true },
    });

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

    const url = generateSignedUrl(key);
    return res.json({ data: { url }, error: null });
  } catch (error) {
    console.error("Error generating stream URL:", error);
    return res.status(500).json({ data: null, error: "Failed to generate stream URL" });
  }
});

export default streamRouter;
