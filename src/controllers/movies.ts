// import { db } from "@/db/db";
// import { Request, Response } from "express";

// /* Helper function to generate slug from title */
// function generateSlug(title: string): string {
//   return title
//     .toLowerCase()
//     .trim()
//     .replace(/[^\w\s-]/g, "")
//     .replace(/[\s_-]+/g, "-")
//     .replace(/^-+|-+$/g, "");
// }

// /* ======================
//    CREATE MOVIE
// ====================== */
// export async function createMovie(req: Request, res: Response) {
//   const {
//     title,
//     image,
//     poster,
//     trailerPoster,
//     rating,
//     vjId,
//     genreId,
//     yearId,
//     size,
//     sizeBytes,
//     length,
//     lengthSeconds,
//     description,
//     director,
//     cast,
//     trailerUrl,
//     videoUrl,
//     isComingSoon,
//     isTrending,
//   } = req.body;

//   try {
//     // Validation
//     if (!title || !title.trim()) {
//       return res.status(400).json({ data: null, error: "Movie title is required" });
//     }

//     if (!vjId || !genreId || !yearId) {
//       return res.status(400).json({ data: null, error: "VJ, Genre, and Year are required" });
//     }

//     const titleNorm = title.trim();
//     const slug = generateSlug(titleNorm);

//     // Check for existing movie with same slug
//     const existingMovie = await db.movie.findUnique({
//       where: { slug },
//       select: { id: true },
//     });

//     if (existingMovie) {
//       return res.status(409).json({
//         data: null,
//         error: "Movie with this title already exists",
//       });
//     }

//     const newMovie = await db.movie.create({
//       data: {
//         title: titleNorm,
//         slug,
//         image: image || "",
//         poster: poster || "",
//         trailerPoster: trailerPoster || "",
//         rating: parseFloat(rating) || 0,
//         vjId,
//         genreId,
//         yearId,
//         size: size || "",
//         sizeBytes: sizeBytes ? BigInt(sizeBytes) : null,
//         length: length || "",
//         lengthSeconds: lengthSeconds ? parseInt(lengthSeconds) : null,
//         description: description?.trim() || "",
//         director: director?.trim() || "",
//         cast: Array.isArray(cast) ? cast : [],
//         trailerUrl: trailerUrl || "",
//         videoUrl: videoUrl || "",
//         isComingSoon: isComingSoon === true || isComingSoon === "true",
//         isTrending: isTrending === true || isTrending === "true",
//       },
//       include: {
//         vj: {
//           select: {
//             id: true,
//             name: true,
//             avatarUrl: true,
//           },
//         },
//         genre: {
//           select: {
//             id: true,
//             name: true,
//             slug: true,
//           },
//         },
//         year: {
//           select: {
//             id: true,
//             value: true,
//           },
//         },
//       },
//     });

//     return res.status(201).json({ data: newMovie, error: null });
//   } catch (error) {
//     console.error("Error creating movie:", error);
//     return res.status(500).json({ data: null, error: "Failed to create movie" });
//   }
// }

// /* ======================
//    GET ALL MOVIES
// ====================== */
// export async function getAllMovies(req: Request, res: Response) {
//   try {
//     const {
//       page = "1",
//       limit = "20",
//       genreId,
//       vjId,
//       yearId,
//       isTrending,
//       isComingSoon,
//       search,
//     } = req.query;

//     const pageNum = parseInt(page as string);
//     const limitNum = parseInt(limit as string);
//     const skip = (pageNum - 1) * limitNum;

//     // Build where clause
//     const where: any = {};

//     if (genreId) where.genreId = genreId;
//     if (vjId) where.vjId = vjId;
//     if (yearId) where.yearId = yearId;
//     if (isTrending) where.isTrending = isTrending === "true";
//     if (isComingSoon) where.isComingSoon = isComingSoon === "true";
//     if (search) {
//       where.OR = [
//         { title: { contains: search as string, mode: "insensitive" } },
//         { description: { contains: search as string, mode: "insensitive" } },
//         { director: { contains: search as string, mode: "insensitive" } },
//       ];
//     }

//     const [movies, total] = await Promise.all([
//       db.movie.findMany({
//         where,
//         skip,
//         take: limitNum,
//         orderBy: { createdAt: "desc" },
//         include: {
//           vj: {
//             select: {
//               id: true,
//               name: true,
//               avatarUrl: true,
//             },
//           },
//           genre: {
//             select: {
//               id: true,
//               name: true,
//               slug: true,
//             },
//           },
//           year: {
//             select: {
//               id: true,
//               value: true,
//             },
//           },
//         },
//       }),
//       db.movie.count({ where }),
//     ]);

//     return res.status(200).json({
//       data: movies,
//       error: null,
//       pagination: {
//         total,
//         page: pageNum,
//         limit: limitNum,
//         totalPages: Math.ceil(total / limitNum),
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching movies:", error);
//     return res.status(500).json({ data: null, error: "Failed to fetch movies" });
//   }
// }

// /* ======================
//    GET MOVIE BY ID
// ====================== */
// export async function getMovieById(req: Request, res: Response) {
//   const { id } = req.params;

//   try {
//     const movie = await db.movie.findUnique({
//       where: { id },
//       include: {
//         vj: {
//           select: {
//             id: true,
//             name: true,
//             avatarUrl: true,
//             bio: true,
//           },
//         },
//         genre: {
//           select: {
//             id: true,
//             name: true,
//             slug: true,
//             description: true,
//           },
//         },
//         year: {
//           select: {
//             id: true,
//             value: true,
//           },
//         },
//       },
//     });

//     if (!movie) {
//       return res.status(404).json({ data: null, error: "Movie not found" });
//     }

//     return res.status(200).json({ data: movie, error: null });
//   } catch (error) {
//     console.error("Error fetching movie by id:", error);
//     return res.status(500).json({ data: null, error: "Server error" });
//   }
// }

// /* ======================
//    GET MOVIE BY SLUG
// ====================== */
// export async function getMovieBySlug(req: Request, res: Response) {
//   const { slug } = req.params;

//   try {
//     const movie = await db.movie.findUnique({
//       where: { slug },
//       include: {
//         vj: {
//           select: {
//             id: true,
//             name: true,
//             avatarUrl: true,
//             bio: true,
//           },
//         },
//         genre: {
//           select: {
//             id: true,
//             name: true,
//             slug: true,
//             description: true,
//           },
//         },
//         year: {
//           select: {
//             id: true,
//             value: true,
//           },
//         },
//       },
//     });

//     if (!movie) {
//       return res.status(404).json({ data: null, error: "Movie not found" });
//     }

//     return res.status(200).json({ data: movie, error: null });
//   } catch (error) {
//     console.error("Error fetching movie by slug:", error);
//     return res.status(500).json({ data: null, error: "Server error" });
//   }
// }

// /* ======================
//    UPDATE MOVIE
// ====================== */
// export async function updateMovie(req: Request, res: Response) {
//   const { id } = req.params;
//   const updateData = req.body;

//   try {
//     const existingMovie = await db.movie.findUnique({ where: { id } });
//     if (!existingMovie) {
//       return res.status(404).json({ data: null, error: "Movie not found" });
//     }

//     // If updating title, regenerate slug
//     let slug = existingMovie.slug;
//     if (updateData.title && updateData.title.trim() !== existingMovie.title) {
//       const titleNorm = updateData.title.trim();
//       slug = generateSlug(titleNorm);

//       const conflictMovie = await db.movie.findFirst({
//         where: {
//           slug,
//           NOT: { id },
//         },
//         select: { id: true },
//       });

//       if (conflictMovie) {
//         return res.status(409).json({
//           data: null,
//           error: "Movie with this title already exists",
//         });
//       }
//     }

//     // Build update object
//     const data: any = {
//       slug,
//     };

//     if (updateData.title) data.title = updateData.title.trim();
//     if (updateData.image !== undefined) data.image = updateData.image;
//     if (updateData.poster !== undefined) data.poster = updateData.poster;
//     if (updateData.trailerPoster !== undefined) data.trailerPoster = updateData.trailerPoster;
//     if (updateData.rating !== undefined) data.rating = parseFloat(updateData.rating);
//     if (updateData.vjId) data.vjId = updateData.vjId;
//     if (updateData.genreId) data.genreId = updateData.genreId;
//     if (updateData.yearId) data.yearId = updateData.yearId;
//     if (updateData.size !== undefined) data.size = updateData.size;
//     if (updateData.sizeBytes !== undefined) data.sizeBytes = updateData.sizeBytes ? BigInt(updateData.sizeBytes) : null;
//     if (updateData.length !== undefined) data.length = updateData.length;
//     if (updateData.lengthSeconds !== undefined) data.lengthSeconds = updateData.lengthSeconds ? parseInt(updateData.lengthSeconds) : null;
//     if (updateData.description !== undefined) data.description = updateData.description?.trim() || "";
//     if (updateData.director !== undefined) data.director = updateData.director?.trim() || "";
//     if (updateData.cast !== undefined) data.cast = Array.isArray(updateData.cast) ? updateData.cast : [];
//     if (updateData.trailerUrl !== undefined) data.trailerUrl = updateData.trailerUrl;
//     if (updateData.videoUrl !== undefined) data.videoUrl = updateData.videoUrl;
//     if (updateData.isComingSoon !== undefined) data.isComingSoon = updateData.isComingSoon === true || updateData.isComingSoon === "true";
//     if (updateData.isTrending !== undefined) data.isTrending = updateData.isTrending === true || updateData.isTrending === "true";

//     const updatedMovie = await db.movie.update({
//       where: { id },
//       data,
//       include: {
//         vj: {
//           select: {
//             id: true,
//             name: true,
//             avatarUrl: true,
//           },
//         },
//         genre: {
//           select: {
//             id: true,
//             name: true,
//             slug: true,
//           },
//         },
//         year: {
//           select: {
//             id: true,
//             value: true,
//           },
//         },
//       },
//     });

//     return res.status(200).json({ data: updatedMovie, error: null });
//   } catch (error) {
//     console.error("Error updating movie:", error);
//     return res.status(500).json({ data: null, error: "Failed to update movie" });
//   }
// }

// /* ======================
//    DELETE MOVIE
// ====================== */
// export async function deleteMovie(req: Request, res: Response) {
//   const { id } = req.params;

//   try {
//     const existingMovie = await db.movie.findUnique({
//       where: { id },
//     });

//     if (!existingMovie) {
//       return res.status(404).json({ data: null, error: "Movie not found" });
//     }

//     await db.movie.delete({ where: { id } });

//     return res.status(200).json({
//       data: null,
//       message: "Movie deleted successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting movie:", error);
//     return res.status(500).json({ data: null, error: "Failed to delete movie" });
//   }
// }

// /* ======================
//    INCREMENT VIEW COUNT
// ====================== */
// export async function incrementViewCount(req: Request, res: Response) {
//   const { id } = req.params;

//   try {
//     const movie = await db.movie.update({
//       where: { id },
//       data: {
//         viewsCount: {
//           increment: 1,
//         },
//       },
//       select: {
//         id: true,
//         viewsCount: true,
//       },
//     });

//     return res.status(200).json({ data: movie, error: null });
//   } catch (error) {
//     console.error("Error incrementing view count:", error);
//     return res.status(500).json({ data: null, error: "Failed to increment view count" });
//   }
// }

// /* ======================
//    GET TRENDING MOVIES
// ====================== */
// export async function getTrendingMovies(req: Request, res: Response) {
//   const { limit = "10" } = req.query;

//   try {
//     const movies = await db.movie.findMany({
//       where: { isTrending: true },
//       take: parseInt(limit as string),
//       orderBy: { viewsCount: "desc" },
//       include: {
//         vj: {
//           select: {
//             id: true,
//             name: true,
//             avatarUrl: true,
//           },
//         },
//         genre: {
//           select: {
//             id: true,
//             name: true,
//             slug: true,
//           },
//         },
//         year: {
//           select: {
//             id: true,
//             value: true,
//           },
//         },
//       },
//     });

//     return res.status(200).json({ data: movies, error: null });
//   } catch (error) {
//     console.error("Error fetching trending movies:", error);
//     return res.status(500).json({ data: null, error: "Failed to fetch trending movies" });
//   }
// }

// /* ======================
//    GET COMING SOON MOVIES
// ====================== */
// export async function getComingSoonMovies(req: Request, res: Response) {
//   const { limit = "10" } = req.query;

//   try {
//     const movies = await db.movie.findMany({
//       where: { isComingSoon: true },
//       take: parseInt(limit as string),
//       orderBy: { createdAt: "desc" },
//       include: {
//         vj: {
//           select: {
//             id: true,
//             name: true,
//             avatarUrl: true,
//           },
//         },
//         genre: {
//           select: {
//             id: true,
//             name: true,
//             slug: true,
//           },
//         },
//         year: {
//           select: {
//             id: true,
//             value: true,
//           },
//         },
//       },
//     });

//     return res.status(200).json({ data: movies, error: null });
//   } catch (error) {
//     console.error("Error fetching coming soon movies:", error);
//     return res.status(500).json({ data: null, error: "Failed to fetch coming soon movies" });
//   }
// }




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

/* Helper function to generate slug from title */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ======================
   CREATE MOVIE
====================== */
export async function createMovie(req: Request, res: Response) {
  const {
    title,
    image,
    poster,
    trailerPoster,
    rating,
    vjId,
    genreId,
    yearId,
    size,
    sizeBytes,
    length,
    lengthSeconds,
    description,
    director,
    cast,
    trailerUrl,
    videoUrl,
    isComingSoon,
    isTrending,
  } = req.body;

  try {
    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ data: null, error: "Movie title is required" });
    }

    if (!vjId || !genreId || !yearId) {
      return res.status(400).json({ data: null, error: "VJ, Genre, and Year are required" });
    }

    const titleNorm = title.trim();
    const slug = generateSlug(titleNorm);

    // Check for existing movie with same slug
    const existingMovie = await db.movie.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingMovie) {
      return res.status(409).json({
        data: null,
        error: "Movie with this title already exists",
      });
    }

    const newMovie = await db.movie.create({
      data: {
        title: titleNorm,
        slug,
        image: image || "",
        poster: poster || "",
        trailerPoster: trailerPoster || "",
        rating: parseFloat(rating) || 0,
        vjId,
        genreId,
        yearId,
        size: size || "",
        sizeBytes: sizeBytes ? BigInt(sizeBytes) : null,
        length: length || "",
        lengthSeconds: lengthSeconds ? parseInt(lengthSeconds) : null,
        description: description?.trim() || "",
        director: director?.trim() || "",
        cast: Array.isArray(cast) ? cast : [],
        trailerUrl: trailerUrl || "",
        videoUrl: videoUrl || "",
        isComingSoon: isComingSoon === true || isComingSoon === "true",
        isTrending: isTrending === true || isTrending === "true",
      },
      include: {
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
    });

    return res.status(201).json({ data: serializeBigInt(newMovie), error: null });
  } catch (error) {
    console.error("Error creating movie:", error);
    return res.status(500).json({ data: null, error: "Failed to create movie" });
  }
}

/* ======================
   GET ALL MOVIES
====================== */
export async function getAllMovies(req: Request, res: Response) {
  try {
    const {
      page = "1",
      limit = "20",
      genreId,
      vjId,
      yearId,
      isTrending,
      isComingSoon,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (genreId) where.genreId = genreId;
    if (vjId) where.vjId = vjId;
    if (yearId) where.yearId = yearId;
    if (isTrending) where.isTrending = isTrending === "true";
    if (isComingSoon) where.isComingSoon = isComingSoon === "true";
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { director: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [movies, total] = await Promise.all([
      db.movie.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
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
      }),
      db.movie.count({ where }),
    ]);

    return res.status(200).json({
      data: serializeBigInt(movies),
      error: null,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch movies" });
  }
}

/* ======================
   GET MOVIE BY ID
====================== */
export async function getMovieById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const movie = await db.movie.findUnique({
      where: { id },
      include: {
        vj: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
        genre: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        year: {
          select: {
            id: true,
            value: true,
          },
        },
      },
    });

    if (!movie) {
      return res.status(404).json({ data: null, error: "Movie not found" });
    }

    return res.status(200).json({ data: serializeBigInt(movie), error: null });
  } catch (error) {
    console.error("Error fetching movie by id:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* ======================
   GET MOVIE BY SLUG
====================== */
export async function getMovieBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  try {
    const movie = await db.movie.findUnique({
      where: { slug },
      include: {
        vj: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
        genre: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        year: {
          select: {
            id: true,
            value: true,
          },
        },
      },
    });

    if (!movie) {
      return res.status(404).json({ data: null, error: "Movie not found" });
    }

    return res.status(200).json({ data: serializeBigInt(movie), error: null });
  } catch (error) {
    console.error("Error fetching movie by slug:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* ======================
   UPDATE MOVIE
====================== */
export async function updateMovie(req: Request, res: Response) {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const existingMovie = await db.movie.findUnique({ where: { id } });
    if (!existingMovie) {
      return res.status(404).json({ data: null, error: "Movie not found" });
    }

    // If updating title, regenerate slug
    let slug = existingMovie.slug;
    if (updateData.title && updateData.title.trim() !== existingMovie.title) {
      const titleNorm = updateData.title.trim();
      slug = generateSlug(titleNorm);

      const conflictMovie = await db.movie.findFirst({
        where: {
          slug,
          NOT: { id },
        },
        select: { id: true },
      });

      if (conflictMovie) {
        return res.status(409).json({
          data: null,
          error: "Movie with this title already exists",
        });
      }
    }

    // Build update object
    const data: any = {
      slug,
    };

    if (updateData.title) data.title = updateData.title.trim();
    if (updateData.image !== undefined) data.image = updateData.image;
    if (updateData.poster !== undefined) data.poster = updateData.poster;
    if (updateData.trailerPoster !== undefined) data.trailerPoster = updateData.trailerPoster;
    if (updateData.rating !== undefined) data.rating = parseFloat(updateData.rating);
    if (updateData.vjId) data.vjId = updateData.vjId;
    if (updateData.genreId) data.genreId = updateData.genreId;
    if (updateData.yearId) data.yearId = updateData.yearId;
    if (updateData.size !== undefined) data.size = updateData.size;
    if (updateData.sizeBytes !== undefined) data.sizeBytes = updateData.sizeBytes ? BigInt(updateData.sizeBytes) : null;
    if (updateData.length !== undefined) data.length = updateData.length;
    if (updateData.lengthSeconds !== undefined) data.lengthSeconds = updateData.lengthSeconds ? parseInt(updateData.lengthSeconds) : null;
    if (updateData.description !== undefined) data.description = updateData.description?.trim() || "";
    if (updateData.director !== undefined) data.director = updateData.director?.trim() || "";
    if (updateData.cast !== undefined) data.cast = Array.isArray(updateData.cast) ? updateData.cast : [];
    if (updateData.trailerUrl !== undefined) data.trailerUrl = updateData.trailerUrl;
    if (updateData.videoUrl !== undefined) data.videoUrl = updateData.videoUrl;
    if (updateData.isComingSoon !== undefined) data.isComingSoon = updateData.isComingSoon === true || updateData.isComingSoon === "true";
    if (updateData.isTrending !== undefined) data.isTrending = updateData.isTrending === true || updateData.isTrending === "true";

    const updatedMovie = await db.movie.update({
      where: { id },
      data,
      include: {
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
    });

    return res.status(200).json({ data: serializeBigInt(updatedMovie), error: null });
  } catch (error) {
    console.error("Error updating movie:", error);
    return res.status(500).json({ data: null, error: "Failed to update movie" });
  }
}

/* ======================
   DELETE MOVIE
====================== */
export async function deleteMovie(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const existingMovie = await db.movie.findUnique({
      where: { id },
    });

    if (!existingMovie) {
      return res.status(404).json({ data: null, error: "Movie not found" });
    }

    await db.movie.delete({ where: { id } });

    return res.status(200).json({
      data: null,
      message: "Movie deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting movie:", error);
    return res.status(500).json({ data: null, error: "Failed to delete movie" });
  }
}

/* ======================
   INCREMENT VIEW COUNT
====================== */
export async function incrementViewCount(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const movie = await db.movie.update({
      where: { id },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        viewsCount: true,
      },
    });

    return res.status(200).json({ data: serializeBigInt(movie), error: null });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    return res.status(500).json({ data: null, error: "Failed to increment view count" });
  }
}

/* ======================
   GET TRENDING MOVIES
====================== */
export async function getTrendingMovies(req: Request, res: Response) {
  const { limit = "10" } = req.query;

  try {
    const movies = await db.movie.findMany({
      where: { isTrending: true },
      take: parseInt(limit as string),
      orderBy: { viewsCount: "desc" },
      include: {
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
    });

    return res.status(200).json({ data: serializeBigInt(movies), error: null });
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch trending movies" });
  }
}

/* ======================
   GET COMING SOON MOVIES
====================== */
export async function getComingSoonMovies(req: Request, res: Response) {
  const { limit = "10" } = req.query;

  try {
    const movies = await db.movie.findMany({
      where: { isComingSoon: true },
      take: parseInt(limit as string),
      orderBy: { createdAt: "desc" },
      include: {
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
    });

    return res.status(200).json({ data: serializeBigInt(movies), error: null });
  } catch (error) {
    console.error("Error fetching coming soon movies:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch coming soon movies" });
  }
}