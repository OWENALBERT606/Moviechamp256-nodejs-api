import { PrismaClient } from "@prisma/client";
import slugify from "slugify";
import { searchMovies, searchSeries, getMovieDetails, getSeriesDetails } from "./tmdb.service";
import { getOmdbData } from "./omdb.service";
import { resolveTrailer } from "./trailer.service";
import { resolveGenre } from "./genre.resolver";
import { resolveYear } from "./year.resolver";

/* ── Slug generator ── */
async function generateUniqueSlug(
  title: string,
  prisma: PrismaClient,
  model: "movie" | "series" = "movie"
): Promise<string> {
  let slug = slugify(title, { lower: true, strict: true });
  const existing = model === "movie"
    ? await prisma.movie.findUnique({ where: { slug } })
    : await prisma.series.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;
  return slug;
}

/* ══════════════════════════════════════════════════════════════
   MOVIES
══════════════════════════════════════════════════════════════ */

/** Step 1 — search candidates */
export async function fetchMovieMetadata(title: string) {
  return searchMovies(title);
}

/** Step 2 — enrich after admin picks a result */
export async function enrichMovieById(tmdbId: number, prisma: PrismaClient) {
  // Fetch TMDB details
  const tmdb = await getMovieDetails(tmdbId);
  if (!tmdb) throw new Error("TMDB movie not found");

  // Fetch OMDB in parallel with trailer resolution
  const [omdb, trailerResult] = await Promise.all([
    getOmdbData(tmdb.imdbId, tmdb.title, tmdb.releaseYear),
    resolveTrailer({
      title:          tmdb.title,
      year:           tmdb.releaseYear,
      imdbId:         tmdb.imdbId,
      tmdbTrailerKey: tmdb.tmdbTrailerKey,
    }),
  ]);

  // Resolve genre and year in DB
  const firstGenre = tmdb.genres[0] || null;
  const [genreId, yearId, slug] = await Promise.all([
    firstGenre ? resolveGenre(firstGenre, prisma) : Promise.resolve(null),
    resolveYear(tmdb.releaseDate, prisma),
    generateUniqueSlug(tmdb.title, prisma, "movie"),
  ]);

  const rating       = omdb?.imdbRating ?? tmdb.tmdbRating;
  const ratingSource = omdb?.imdbRating ? "imdb" : "tmdb";

  return {
    // Auto-filled — admin can override
    title:         tmdb.title,
    description:   tmdb.description,
    poster:        tmdb.poster,
    image:         tmdb.image,
    trailerPoster: tmdb.trailerPoster,
    director:      tmdb.director,
    cast:          tmdb.cast,
    rating,
    length:        tmdb.length,
    lengthSeconds: tmdb.lengthSeconds,
    trailerUrl:    trailerResult.url,
    isTrending:    tmdb.isTrending,
    isComingSoon:  tmdb.isComingSoon,
    genreId,
    yearId,
    slug,

    // Always null — admin fills these
    videoUrl:    null,
    vjId:        null,
    size:        null,
    sizeBytes:   null,
    downloadUrl: null,
    subtitles:   null,

    // UI metadata only — not stored in DB
    _meta: {
      tmdbId:        tmdb.tmdbId,
      imdbId:        omdb?.imdbId ?? tmdb.imdbId,
      posterOptions: tmdb.posterOptions,
      trailerSource: trailerResult.source,
      ratingSource,
    },
  };
}

/* ══════════════════════════════════════════════════════════════
   SERIES
══════════════════════════════════════════════════════════════ */

/** Step 1 — search candidates */
export async function fetchSeriesMetadata(title: string) {
  return searchSeries(title);
}

/** Step 2 — enrich after admin picks a result */
export async function enrichSeriesById(tmdbId: number, prisma: PrismaClient) {
  const tmdb = await getSeriesDetails(tmdbId);
  if (!tmdb) throw new Error("TMDB series not found");

  const [omdb, trailerResult] = await Promise.all([
    getOmdbData(tmdb.imdbId, tmdb.title, tmdb.releaseYear),
    resolveTrailer({
      title:          tmdb.title,
      year:           tmdb.releaseYear,
      imdbId:         tmdb.imdbId,
      tmdbTrailerKey: tmdb.tmdbTrailerKey,
    }),
  ]);

  const firstGenre = tmdb.genres[0] || null;
  const [genreId, yearId, slug] = await Promise.all([
    firstGenre ? resolveGenre(firstGenre, prisma) : Promise.resolve(null),
    resolveYear(tmdb.releaseDate, prisma),
    generateUniqueSlug(tmdb.title, prisma, "series"),
  ]);

  const rating       = omdb?.imdbRating ?? tmdb.tmdbRating;
  const ratingSource = omdb?.imdbRating ? "imdb" : "tmdb";

  return {
    title:         tmdb.title,
    description:   tmdb.description,
    poster:        tmdb.poster,
    image:         tmdb.image,
    trailerPoster: tmdb.trailerPoster,
    director:      tmdb.director,
    cast:          tmdb.cast,
    rating,
    trailerUrl:    trailerResult.url,
    isTrending:    tmdb.isTrending,
    isComingSoon:  tmdb.isComingSoon,
    totalSeasons:  tmdb.totalSeasons,
    totalEpisodes: tmdb.totalEpisodes,
    genreId,
    yearId,
    slug,

    // Always null — admin fills these
    vjId:        null,
    downloadUrl: null,
    subtitles:   null,

    _meta: {
      tmdbId:        tmdb.tmdbId,
      imdbId:        omdb?.imdbId ?? tmdb.imdbId,
      posterOptions: tmdb.posterOptions,
      trailerSource: trailerResult.source,
      ratingSource,
    },
  };
}
