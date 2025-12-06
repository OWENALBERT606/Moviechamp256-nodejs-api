import { db } from "@/db/db";
import { Request, Response } from "express";
import { AuthRequest } from "@/utils/auth";

/* Helper function to generate slug from name */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/* ======================
   CREATE GENRE
====================== */
export async function createGenre(req: Request, res: Response) {
  const { name, description } = req.body as {
    name: string;
    description?: string;
  };

  try {
    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ data: null, error: "Genre name is required" });
    }

    const nameNorm = name.trim();
    const slug = generateSlug(nameNorm);

    // Check for existing genre with same name or slug
    const existingGenre = await db.genre.findFirst({
      where: {
        OR: [{ name: nameNorm }, { slug }],
      },
      select: { id: true },
    });

    if (existingGenre) {
      return res.status(409).json({
        data: null,
        error: "Genre with this name already exists",
      });
    }

    const newGenre = await db.genre.create({
      data: {
        name: nameNorm,
        slug,
        description: description?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({ data: newGenre, error: null });
  } catch (error) {
    console.error("Error creating genre:", error);
    return res.status(500).json({ data: null, error: "Failed to create genre" });
  }
}

/* ======================
   GET ALL GENRES
====================== */
export async function getAllGenres(req: Request, res: Response) {
  try {
    const genres = await db.genre.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movies: true },
        },
      },
    });

    return res.status(200).json({ data: genres, error: null });
  } catch (error) {
    console.error("Error fetching genres:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch genres" });
  }
}

/* ======================
   GET GENRE BY ID
====================== */
export async function getGenreById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const genre = await db.genre.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movies: true },
        },
      },
    });

    if (!genre) {
      return res.status(404).json({ data: null, error: "Genre not found" });
    }

    return res.status(200).json({ data: genre, error: null });
  } catch (error) {
    console.error("Error fetching genre by id:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* ======================
   GET GENRE BY SLUG
====================== */
export async function getGenreBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  try {
    const genre = await db.genre.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movies: true },
        },
      },
    });

    if (!genre) {
      return res.status(404).json({ data: null, error: "Genre not found" });
    }

    return res.status(200).json({ data: genre, error: null });
  } catch (error) {
    console.error("Error fetching genre by slug:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* ======================
   UPDATE GENRE
====================== */
export async function updateGenre(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description } = req.body as {
    name?: string;
    description?: string;
  };

  try {
    const existingGenre = await db.genre.findUnique({ where: { id } });
    if (!existingGenre) {
      return res.status(404).json({ data: null, error: "Genre not found" });
    }

    // If updating name, check for conflicts and regenerate slug
    let slug = existingGenre.slug;
    if (name && name.trim() !== existingGenre.name) {
      const nameNorm = name.trim();
      slug = generateSlug(nameNorm);

      const conflictGenre = await db.genre.findFirst({
        where: {
          OR: [{ name: nameNorm }, { slug }],
          NOT: { id },
        },
        select: { id: true },
      });

      if (conflictGenre) {
        return res.status(409).json({
          data: null,
          error: "Genre with this name already exists",
        });
      }
    }

    const updatedGenre = await db.genre.update({
      where: { id },
      data: {
        name: name?.trim() ?? existingGenre.name,
        slug,
        description: description !== undefined ? description?.trim() || null : existingGenre.description,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movies: true },
        },
      },
    });

    return res.status(200).json({ data: updatedGenre, error: null });
  } catch (error) {
    console.error("Error updating genre:", error);
    return res.status(500).json({ data: null, error: "Failed to update genre" });
  }
}

/* ======================
   DELETE GENRE
====================== */
export async function deleteGenre(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const existingGenre = await db.genre.findUnique({
      where: { id },
      include: {
        _count: {
          select: { movies: true },
        },
      },
    });

    if (!existingGenre) {
      return res.status(404).json({ data: null, error: "Genre not found" });
    }

    // Check if genre has movies
    if (existingGenre._count.movies > 0) {
      return res.status(400).json({
        data: null,
        error: `Cannot delete genre. It has ${existingGenre._count.movies} movie(s) associated with it.`,
      });
    }

    await db.genre.delete({ where: { id } });

    return res.status(200).json({
      data: null,
      message: "Genre deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting genre:", error);
    return res.status(500).json({ data: null, error: "Failed to delete genre" });
  }
}