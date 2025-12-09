// import express from "express";
// import {
//   createSeries,
//   getAllSeries,
//   getSeriesById,
//   getSeriesBySlug,
//   updateSeries,
//   deleteSeries,
//   incrementSeriesViewCount,
//   getTrendingSeries,
//   getComingSoonSeries,
// } from "@/controllers/series";

// const seriesRouter = express.Router();

// // Public routes - anyone can view series
// seriesRouter.get("/series", getAllSeries);
// seriesRouter.get("/series/trending", getTrendingSeries);
// seriesRouter.get("/series/coming-soon", getComingSoonSeries);
// seriesRouter.get("/series/:id", getSeriesById);
// seriesRouter.get("/series/slug/:slug", getSeriesBySlug);
// seriesRouter.post("/series/:id/view", incrementSeriesViewCount);

// // CRUD routes - no authentication required
// seriesRouter.post("/series", createSeries);
// seriesRouter.put("/series/:id", updateSeries);
// seriesRouter.delete("/series/:id", deleteSeries);

// export default seriesRouter;












import express from "express";
import {
  createSeries,
  getAllSeries,
  getSeriesById,
  getSeriesBySlug,
  updateSeries,
  deleteSeries,
  incrementSeriesViewCount,
  getTrendingSeries,
  getComingSoonSeries,
} from "@/controllers/series";

const seriesRouter = express.Router();

// IMPORTANT: Specific routes MUST come before dynamic routes (:id)
// Otherwise /series/trending will be caught by /series/:id

// Specific routes first (before :id route)
seriesRouter.get("/series/trending", getTrendingSeries);
seriesRouter.get("/series/coming-soon", getComingSoonSeries);
seriesRouter.get("/series/slug/:slug", getSeriesBySlug);

// General list route
seriesRouter.get("/series", getAllSeries);

// Dynamic routes last (after specific routes)
seriesRouter.get("/series/:id", getSeriesById);
seriesRouter.post("/series/:id/view", incrementSeriesViewCount);

// CRUD routes
seriesRouter.post("/series", createSeries);
seriesRouter.put("/series/:id", updateSeries);
seriesRouter.delete("/series/:id", deleteSeries);

export default seriesRouter;