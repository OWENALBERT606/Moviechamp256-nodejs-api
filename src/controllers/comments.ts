import { Request, Response } from "express";
import { db } from "@/db/db";

/**
 * GET /api/v1/comments/:type/:id
 * Fetch comments for a movie or series
 */
export async function getComments(req: Request, res: Response) {
  const { type, id } = req.params;

  try {
    const comments = await db.comment.findMany({
      where: {
        [type === "movie" ? "movieId" : "seriesId"]: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ data: comments });
  } catch (error: any) {
    console.error("Fetch comments error:", error);
    return res.status(500).json({ error: "Failed to fetch comments" });
  }
}

/**
 * POST /api/v1/comments
 * Create a new comment
 */
export async function createComment(req: Request, res: Response) {
  const { content, userId, type, itemId } = req.body;

  if (!content || !userId || !type || !itemId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const comment = await db.comment.create({
      data: {
        content,
        userId,
        [type === "movie" ? "movieId" : "seriesId"]: itemId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    return res.status(201).json({ data: comment });
  } catch (error: any) {
    console.error("Create comment error:", error);
    return res.status(500).json({ error: "Failed to post comment" });
  }
}

/**
 * DELETE /api/v1/comments/:id
 * Delete a comment
 */
export async function deleteComment(req: Request, res: Response) {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const comment = await db.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this comment" });
    }

    await db.comment.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Comment deleted" });
  } catch (error: any) {
    console.error("Delete comment error:", error);
    return res.status(500).json({ error: "Failed to delete comment" });
  }
}
