import { db } from "@/db/db";
import { Request, Response } from "express";

/* Helper function to generate slug from name */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ======================
   CREATE VJ
====================== */
export async function createVJ(req: Request, res: Response) {
  const { name, bio, avatarUrl } = req.body as {
    name: string;
    bio?: string;
    avatarUrl?: string;
  };

  try {
    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ data: null, error: "VJ name is required" });
    }

    const nameNorm = name.trim();

    // Check for existing VJ with same name
    const existingVJ = await db.vJ.findUnique({
      where: { name: nameNorm },
      select: { id: true },
    });

    if (existingVJ) {
      return res.status(409).json({
        data: null,
        error: "VJ with this name already exists",
      });
    }

    const newVJ = await db.vJ.create({
      data: {
        name: nameNorm,
        bio: bio?.trim() || null,
        avatarUrl: avatarUrl?.trim() || undefined, // Let Prisma use default if not provided
      },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({ data: newVJ, error: null });
  } catch (error) {
    console.error("Error creating VJ:", error);
    return res.status(500).json({ data: null, error: "Failed to create VJ" });
  }
}

/* ======================
   GET ALL VJS
====================== */
export async function getAllVJs(req: Request, res: Response) {
  try {
    const vjs = await db.vJ.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movies: true },
        },
      },
    });

    return res.status(200).json({ data: vjs, error: null });
  } catch (error) {
    console.error("Error fetching VJs:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch VJs" });
  }
}

/* ======================
   GET VJ BY ID
====================== */
export async function getVJById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const vj = await db.vJ.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movies: true },
        },
      },
    });

    if (!vj) {
      return res.status(404).json({ data: null, error: "VJ not found" });
    }

    return res.status(200).json({ data: vj, error: null });
  } catch (error) {
    console.error("Error fetching VJ by id:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* ======================
   GET VJ BY NAME
====================== */
export async function getVJByName(req: Request, res: Response) {
  const { name } = req.params;

  try {
    const vj = await db.vJ.findUnique({
      where: { name: decodeURIComponent(name) },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movies: true },
        },
      },
    });

    if (!vj) {
      return res.status(404).json({ data: null, error: "VJ not found" });
    }

    return res.status(200).json({ data: vj, error: null });
  } catch (error) {
    console.error("Error fetching VJ by name:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* ======================
   UPDATE VJ
====================== */
export async function updateVJ(req: Request, res: Response) {
  const { id } = req.params;
  const { name, bio, avatarUrl } = req.body as {
    name?: string;
    bio?: string;
    avatarUrl?: string;
  };

  try {
    const existingVJ = await db.vJ.findUnique({ where: { id } });
    if (!existingVJ) {
      return res.status(404).json({ data: null, error: "VJ not found" });
    }

    // If updating name, check for conflicts
    if (name && name.trim() !== existingVJ.name) {
      const nameNorm = name.trim();

      const conflictVJ = await db.vJ.findFirst({
        where: {
          name: nameNorm,
          NOT: { id },
        },
        select: { id: true },
      });

      if (conflictVJ) {
        return res.status(409).json({
          data: null,
          error: "VJ with this name already exists",
        });
      }
    }

    const updatedVJ = await db.vJ.update({
      where: { id },
      data: {
        name: name?.trim() ?? existingVJ.name,
        bio: bio !== undefined ? bio?.trim() || null : existingVJ.bio,
        avatarUrl: avatarUrl?.trim() ?? existingVJ.avatarUrl,
      },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movies: true },
        },
      },
    });

    return res.status(200).json({ data: updatedVJ, error: null });
  } catch (error) {
    console.error("Error updating VJ:", error);
    return res.status(500).json({ data: null, error: "Failed to update VJ" });
  }
}

/* ======================
   DELETE VJ
====================== */
export async function deleteVJ(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const existingVJ = await db.vJ.findUnique({
      where: { id },
      include: {
        _count: {
          select: { movies: true },
        },
      },
    });

    if (!existingVJ) {
      return res.status(404).json({ data: null, error: "VJ not found" });
    }

    // Check if VJ has movies
    if (existingVJ._count.movies > 0) {
      return res.status(400).json({
        data: null,
        error: `Cannot delete VJ. It has ${existingVJ._count.movies} movie(s) associated with it.`,
      });
    }

    await db.vJ.delete({ where: { id } });

    return res.status(200).json({
      data: null,
      message: "VJ deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting VJ:", error);
    return res.status(500).json({ data: null, error: "Failed to delete VJ" });
  }
}