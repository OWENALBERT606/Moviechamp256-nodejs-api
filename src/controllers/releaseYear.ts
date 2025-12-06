import { db } from "@/db/db";
import { Request, Response } from "express";

/* ======================
   CREATE RELEASE YEAR
====================== */
export async function createReleaseYear(req: Request, res: Response) {
  const { value } = req.body as {
    value: number;
  };

  try {
    // Validation
    if (!value || typeof value !== "number") {
      return res.status(400).json({ data: null, error: "Year value is required and must be a number" });
    }

    // Validate year is reasonable (between 1888 and current year + 5)
    const currentYear = new Date().getFullYear();
    if (value < 1888 || value > currentYear + 5) {
      return res.status(400).json({ 
        data: null, 
        error: `Year must be between 1888 and ${currentYear + 5}` 
      });
    }

    // Check for existing year
    const existingYear = await db.releaseYear.findUnique({
      where: { value },
      select: { id: true },
    });

    if (existingYear) {
      return res.status(409).json({
        data: null,
        error: "This year already exists",
      });
    }

    const newYear = await db.releaseYear.create({
      data: { value },
      select: {
        id: true,
        value: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({ data: newYear, error: null });
  } catch (error) {
    console.error("Error creating release year:", error);
    return res.status(500).json({ data: null, error: "Failed to create release year" });
  }
}

/* ======================
   GET ALL RELEASE YEARS
====================== */
export async function getAllReleaseYears(req: Request, res: Response) {
  try {
    const years = await db.releaseYear.findMany({
      orderBy: { value: "desc" }, // Most recent first
      select: {
        id: true,
        value: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movies: true },
        },
      },
    });

    return res.status(200).json({ data: years, error: null });
  } catch (error) {
    console.error("Error fetching release years:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch release years" });
  }
}

/* ======================
   GET RELEASE YEAR BY ID
====================== */
export async function getReleaseYearById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const year = await db.releaseYear.findUnique({
      where: { id },
      select: {
        id: true,
        value: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movies: true },
        },
      },
    });

    if (!year) {
      return res.status(404).json({ data: null, error: "Release year not found" });
    }

    return res.status(200).json({ data: year, error: null });
  } catch (error) {
    console.error("Error fetching release year by id:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* ======================
   GET RELEASE YEAR BY VALUE
====================== */
export async function getReleaseYearByValue(req: Request, res: Response) {
  const { value } = req.params;

  try {
    const yearValue = parseInt(value);
    
    if (isNaN(yearValue)) {
      return res.status(400).json({ data: null, error: "Invalid year value" });
    }

    const year = await db.releaseYear.findUnique({
      where: { value: yearValue },
      select: {
        id: true,
        value: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movies: true },
        },
      },
    });

    if (!year) {
      return res.status(404).json({ data: null, error: "Release year not found" });
    }

    return res.status(200).json({ data: year, error: null });
  } catch (error) {
    console.error("Error fetching release year by value:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* ======================
   UPDATE RELEASE YEAR
====================== */
export async function updateReleaseYear(req: Request, res: Response) {
  const { id } = req.params;
  const { value } = req.body as {
    value?: number;
  };

  try {
    const existingYear = await db.releaseYear.findUnique({ where: { id } });
    if (!existingYear) {
      return res.status(404).json({ data: null, error: "Release year not found" });
    }

    // If updating value, validate and check for conflicts
    if (value !== undefined) {
      // Validate year is reasonable
      const currentYear = new Date().getFullYear();
      if (value < 1888 || value > currentYear + 5) {
        return res.status(400).json({ 
          data: null, 
          error: `Year must be between 1888 and ${currentYear + 5}` 
        });
      }

      // Check for conflicts
      const conflictYear = await db.releaseYear.findFirst({
        where: {
          value,
          NOT: { id },
        },
        select: { id: true },
      });

      if (conflictYear) {
        return res.status(409).json({
          data: null,
          error: "This year already exists",
        });
      }
    }

    const updatedYear = await db.releaseYear.update({
      where: { id },
      data: {
        value: value ?? existingYear.value,
      },
      select: {
        id: true,
        value: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movies: true },
        },
      },
    });

    return res.status(200).json({ data: updatedYear, error: null });
  } catch (error) {
    console.error("Error updating release year:", error);
    return res.status(500).json({ data: null, error: "Failed to update release year" });
  }
}

/* ======================
   DELETE RELEASE YEAR
====================== */
export async function deleteReleaseYear(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const existingYear = await db.releaseYear.findUnique({
      where: { id },
      include: {
        _count: {
          select: { movies: true },
        },
      },
    });

    if (!existingYear) {
      return res.status(404).json({ data: null, error: "Release year not found" });
    }

    // Check if year has movies
    if (existingYear._count.movies > 0) {
      return res.status(400).json({
        data: null,
        error: `Cannot delete year. It has ${existingYear._count.movies} movie(s) associated with it.`,
      });
    }

    await db.releaseYear.delete({ where: { id } });

    return res.status(200).json({
      data: null,
      message: "Release year deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting release year:", error);
    return res.status(500).json({ data: null, error: "Failed to delete release year" });
  }
}