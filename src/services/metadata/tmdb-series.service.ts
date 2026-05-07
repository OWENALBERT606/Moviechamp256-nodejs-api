import axios from "axios";

const TMDB_BASE_URL   = process.env.TMDB_BASE_URL   || "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p/w500";
const TMDB_STILL_BASE = "https://image.tmdb.org/t/p/w300"; // episode stills
const TMDB_API_KEY    = process.env.TMDB_API_KEY    || "";

const ONE_HOUR = 60 * 60 * 1000;

interface CacheEntry<T> { data: T; expiresAt: number }
const cache = new Map<string, CacheEntry<any>>();
function getCache<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e || Date.now() > e.expiresAt) { cache.delete(key); return null; }
  return e.data as T;
}
function setCache<T>(key: string, data: T, ttl = ONE_HOUR) {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

function tmdbGet(path: string, params: Record<string, any> = {}) {
  return axios.get(`${TMDB_BASE_URL}${path}`, {
    params: { api_key: TMDB_API_KEY, ...params },
    timeout: 10000,
  });
}

/* ── Season details with all episodes ── */
export async function getTmdbSeasonDetails(tmdbSeriesId: number, seasonNumber: number) {
  const cacheKey = `season:${tmdbSeriesId}:${seasonNumber}`;
  const cached = getCache<any>(cacheKey);
  if (cached) return cached;

  try {
    const res = await tmdbGet(`/tv/${tmdbSeriesId}/season/${seasonNumber}`, {
      append_to_response: "images",
    });
    const s = res.data;

    const result = {
      seasonNumber:  s.season_number,
      title:         s.name || null,
      description:   s.overview || null,
      poster:        s.poster_path ? `${TMDB_IMAGE_BASE}${s.poster_path}` : null,
      releaseYear:   s.air_date ? new Date(s.air_date).getFullYear() : null,
      posterOptions: (s.images?.posters || [])
        .slice(0, 5)
        .map((p: any) => `${TMDB_IMAGE_BASE}${p.file_path}`),
      episodes: (s.episodes || []).map((ep: any) => ({
        episodeNumber: ep.episode_number,
        title:         ep.name || `Episode ${ep.episode_number}`,
        description:   ep.overview || null,
        poster:        ep.still_path ? `${TMDB_STILL_BASE}${ep.still_path}` : null,
        length:        ep.runtime ? (ep.runtime >= 60
          ? `${Math.floor(ep.runtime / 60)}h ${ep.runtime % 60}m`
          : `${ep.runtime}m`) : null,
        lengthSeconds: ep.runtime ? ep.runtime * 60 : null,
        releaseDate:   ep.air_date || null,
      })),
    };

    setCache(cacheKey, result);
    return result;
  } catch (e: any) {
    console.error("[tmdb-series.service] getTmdbSeasonDetails error:", e.message);
    return null;
  }
}

/* ── Single episode details ── */
export async function getTmdbEpisodeDetails(
  tmdbSeriesId: number,
  seasonNumber: number,
  episodeNumber: number
) {
  const cacheKey = `episode:${tmdbSeriesId}:${seasonNumber}:${episodeNumber}`;
  const cached = getCache<any>(cacheKey);
  if (cached) return cached;

  try {
    const res = await tmdbGet(
      `/tv/${tmdbSeriesId}/season/${seasonNumber}/episode/${episodeNumber}`,
      { append_to_response: "images" }
    );
    const ep = res.data;

    const result = {
      episodeNumber: ep.episode_number,
      title:         ep.name || `Episode ${ep.episode_number}`,
      description:   ep.overview || null,
      poster:        ep.still_path ? `${TMDB_STILL_BASE}${ep.still_path}` : null,
      stillOptions:  (ep.images?.stills || [])
        .slice(0, 5)
        .map((s: any) => `${TMDB_STILL_BASE}${s.file_path}`),
      length:        ep.runtime ? (ep.runtime >= 60
        ? `${Math.floor(ep.runtime / 60)}h ${ep.runtime % 60}m`
        : `${ep.runtime}m`) : null,
      lengthSeconds: ep.runtime ? ep.runtime * 60 : null,
      releaseDate:   ep.air_date || null,
      director:      (ep.crew || []).find((c: any) => c.job === "Director")?.name || null,
      writers:       (ep.crew || [])
        .filter((c: any) => c.job === "Writer" || c.department === "Writing")
        .slice(0, 3)
        .map((c: any) => c.name),
    };

    setCache(cacheKey, result);
    return result;
  } catch (e: any) {
    console.error("[tmdb-series.service] getTmdbEpisodeDetails error:", e.message);
    return null;
  }
}
