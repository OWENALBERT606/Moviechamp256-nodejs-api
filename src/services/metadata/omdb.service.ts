import axios from "axios";

const OMDB_API_KEY = process.env.OMDB_API_KEY || "";
const OMDB_BASE    = "https://www.omdbapi.com";

export async function getOmdbData(
  imdbId: string | null = null,
  title: string | null  = null,
  year: string | null   = null
): Promise<{ imdbRating: number; imdbId: string } | null> {
  try {
    const params: Record<string, string> = { apikey: OMDB_API_KEY };

    if (imdbId) {
      params.i = imdbId;
    } else if (title) {
      params.t = title;
      if (year) params.y = year;
    } else {
      return null;
    }

    const res = await axios.get(OMDB_BASE, { params, timeout: 6000 });
    const data = res.data;

    if (data.Response === "False") return null;

    const rating = parseFloat(data.imdbRating);
    if (isNaN(rating)) return null;

    return {
      imdbRating: rating,
      imdbId:     data.imdbID || imdbId || "",
    };
  } catch (e: any) {
    console.error("[omdb.service] getOmdbData error:", e.message);
    return null;
  }
}
