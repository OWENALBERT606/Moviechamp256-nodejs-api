import axios from "axios";

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_BASE = process.env.TMDB_BACKDROP_BASE || "https://image.tmdb.org/t/p/original";
const TMDB_API_KEY = process.env.TMDB_API_KEY || "";

/* ── Simple in-memory cache ── */
interface CacheEntry<T> { data: T; expiresAt: number }
const cache = new Map<string, CacheEntry<any>>();

function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data as T;
}
function setCache<T>(key: string, data: T, ttlMs: number) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

const SIX_HOURS = 6 * 60 * 60 * 1000;
const ONE_HOUR  = 60 * 60 * 1000;

function tmdbGet(path: string, params: Record<string, any> = {}) {
  return axios.get(`${TMDB_BASE_URL}${path}`, {
    params: { api_key: TMDB_API_KEY, ...params },
    timeout: 8000,
  });
}

/* ── Search ── */
export async function searchMovies(title: string) {
  try {
    const res = await tmdbGet("/search/movie", { query: title, include_adult: false });
    return (res.data.results || []).map((m: any) => ({
      tmdbId:   m.id,
      title:    m.title,
      year:     m.release_date ? m.release_date.slice(0, 4) : null,
      poster:   m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
      overview: m.overview,
    }));
  } catch (e: any) {
    console.error("[tmdb.service] searchMovies error:", e.message);
    return [];
  }
}

export async function searchSeries(title: string) {
  try {
    const res = await tmdbGet("/search/tv", { query: title, include_adult: false });
    return (res.data.results || []).map((s: any) => ({
      tmdbId:   s.id,
      title:    s.name,
      year:     s.first_air_date ? s.first_air_date.slice(0, 4) : null,
      poster:   s.poster_path ? `${TMDB_IMAGE_BASE}${s.poster_path}` : null,
      overview: s.overview,
    }));
  } catch (e: any) {
    console.error("[tmdb.service] searchSeries error:", e.message);
    return [];
  }
}

/* ── Detail ── */
export async function getMovieDetails(tmdbId: number) {
  const cacheKey = `movie:${tmdbId}`;
  const cached = getCache<any>(cacheKey);
  if (cached) return cached;

  try {
    const res = await tmdbGet(`/movie/${tmdbId}`, {
      append_to_response: "credits,videos,images",
    });
    const m = res.data;

    const runtime = m.runtime || 0;
    const hours   = Math.floor(runtime / 60);
    const mins    = runtime % 60;
    const length  = runtime > 60 ? `${hours}h ${mins}m` : `${runtime}m`;

    const trendingIds  = await getTrendingMovieIds();
    const upcomingIds  = await getUpcomingMovieIds();
    const tmdbTrailerKey = (m.videos?.results || []).find(
      (v: any) => v.type === "Trailer" && v.site === "YouTube"
    )?.key ?? null;

    const posterOptions = (m.images?.posters || [])
      .slice(0, 5)
      .map((p: any) => `${TMDB_IMAGE_BASE}${p.file_path}`);

    const result = {
      title:           m.title,
      description:     m.overview || "",
      poster:          m.poster_path   ? `${TMDB_IMAGE_BASE}${m.poster_path}`     : null,
      image:           m.backdrop_path ? `${TMDB_BACKDROP_BASE}${m.backdrop_path}` : null,
      trailerPoster:   m.backdrop_path ? `${TMDB_BACKDROP_BASE}${m.backdrop_path}` : null,
      director:        (m.credits?.crew || []).find((p: any) => p.job === "Director")?.name ?? null,
      cast:            (m.credits?.cast || []).slice(0, 10).map((p: any) => p.name),
      tmdbRating:      parseFloat(m.vote_average) || 0,
      tmdbId:          m.id,
      imdbId:          m.imdb_id || null,
      runtime,
      length,
      lengthSeconds:   runtime * 60,
      releaseDate:     m.release_date || null,
      releaseYear:     m.release_date ? m.release_date.slice(0, 4) : null,
      genres:          (m.genres || []).map((g: any) => g.name),
      tmdbTrailerKey,
      isTrending:      trendingIds.includes(m.id),
      isComingSoon:    upcomingIds.includes(m.id),
      posterOptions,
    };

    setCache(cacheKey, result, ONE_HOUR);
    return result;
  } catch (e: any) {
    console.error("[tmdb.service] getMovieDetails error:", e.message);
    return null;
  }
}

export async function getSeriesDetails(tmdbId: number) {
  const cacheKey = `series:${tmdbId}`;
  const cached = getCache<any>(cacheKey);
  if (cached) return cached;

  try {
    const res = await tmdbGet(`/tv/${tmdbId}`, {
      append_to_response: "credits,videos,images",
    });
    const s = res.data;

    const tmdbTrailerKey = (s.videos?.results || []).find(
      (v: any) => v.type === "Trailer" && v.site === "YouTube"
    )?.key ?? null;

    const posterOptions = (s.images?.posters || [])
      .slice(0, 5)
      .map((p: any) => `${TMDB_IMAGE_BASE}${p.file_path}`);

    const result = {
      title:         s.name,
      description:   s.overview || "",
      poster:        s.poster_path   ? `${TMDB_IMAGE_BASE}${s.poster_path}`     : null,
      image:         s.backdrop_path ? `${TMDB_BACKDROP_BASE}${s.backdrop_path}` : null,
      trailerPoster: s.backdrop_path ? `${TMDB_BACKDROP_BASE}${s.backdrop_path}` : null,
      director:      (s.credits?.crew || []).find((p: any) => p.job === "Director")?.name ?? null,
      cast:          (s.credits?.cast || []).slice(0, 10).map((p: any) => p.name),
      tmdbRating:    parseFloat(s.vote_average) || 0,
      tmdbId:        s.id,
      imdbId:        s.external_ids?.imdb_id || null,
      releaseDate:   s.first_air_date || null,
      releaseYear:   s.first_air_date ? s.first_air_date.slice(0, 4) : null,
      genres:        (s.genres || []).map((g: any) => g.name),
      totalSeasons:  s.number_of_seasons || 0,
      totalEpisodes: s.number_of_episodes || 0,
      tmdbTrailerKey,
      isTrending:    false,
      isComingSoon:  false,
      posterOptions,
    };

    setCache(cacheKey, result, ONE_HOUR);
    return result;
  } catch (e: any) {
    console.error("[tmdb.service] getSeriesDetails error:", e.message);
    return null;
  }
}

/* ── Trending / Upcoming ── */
export async function getTrendingMovieIds(): Promise<number[]> {
  const cacheKey = "trending_movie_ids";
  const cached = getCache<number[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await tmdbGet("/trending/movie/week");
    const ids = (res.data.results || []).map((m: any) => m.id);
    setCache(cacheKey, ids, SIX_HOURS);
    return ids;
  } catch (e: any) {
    console.error("[tmdb.service] getTrendingMovieIds error:", e.message);
    return [];
  }
}

export async function getUpcomingMovieIds(): Promise<number[]> {
  const cacheKey = "upcoming_movie_ids";
  const cached = getCache<number[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await tmdbGet("/movie/upcoming");
    const ids = (res.data.results || []).map((m: any) => m.id);
    setCache(cacheKey, ids, SIX_HOURS);
    return ids;
  } catch (e: any) {
    console.error("[tmdb.service] getUpcomingMovieIds error:", e.message);
    return [];
  }
}
