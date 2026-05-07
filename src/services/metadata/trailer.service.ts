import axios from "axios";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const YOUTUBE_SEARCH  = "https://www.googleapis.com/youtube/v3/search";

async function searchYouTube(query: string): Promise<string | null> {
  try {
    const res = await axios.get(YOUTUBE_SEARCH, {
      params: {
        part:       "snippet",
        type:       "video",
        maxResults: 1,
        q:          query,
        key:        YOUTUBE_API_KEY,
      },
      timeout: 6000,
    });
    const items = res.data.items || [];
    if (!items.length) return null;
    const videoId = items[0]?.id?.videoId;
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
  } catch (e: any) {
    console.error("[trailer.service] searchYouTube error:", e.message);
    return null;
  }
}

export async function resolveTrailer({
  title,
  year,
  imdbId,
  tmdbTrailerKey,
}: {
  title: string;
  year: string | null;
  imdbId: string | null;
  tmdbTrailerKey: string | null;
}): Promise<{ url: string | null; source: "imdb" | "tmdb" | "youtube" | "manual" }> {
  // Priority 1: YouTube search using IMDb ID
  if (imdbId && YOUTUBE_API_KEY) {
    try {
      const url = await searchYouTube(`"${title}" ${year || ""} official trailer imdb`);
      if (url) return { url, source: "imdb" };
    } catch { /* fall through */ }
  }

  // Priority 2: TMDB trailer key
  if (tmdbTrailerKey) {
    return {
      url:    `https://www.youtube.com/watch?v=${tmdbTrailerKey}`,
      source: "tmdb",
    };
  }

  // Priority 3: YouTube general search
  if (YOUTUBE_API_KEY) {
    try {
      const url = await searchYouTube(`"${title}" ${year || ""} official trailer`);
      if (url) return { url, source: "youtube" };
    } catch { /* fall through */ }
  }

  // Priority 4: Manual
  return { url: null, source: "manual" };
}
