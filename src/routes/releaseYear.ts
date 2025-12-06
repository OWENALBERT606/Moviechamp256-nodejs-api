import express from "express";
import {
  createReleaseYear,
  getAllReleaseYears,
  getReleaseYearById,
  getReleaseYearByValue,
  updateReleaseYear,
  deleteReleaseYear,
} from "@/controllers/releaseYear";

const releaseYearRouter = express.Router();

// All routes are public - no authentication required
releaseYearRouter.get("/release-years", getAllReleaseYears);
releaseYearRouter.get("/release-years/:id", getReleaseYearById);
releaseYearRouter.get("/release-years/value/:value", getReleaseYearByValue);
releaseYearRouter.post("/release-years", createReleaseYear);
releaseYearRouter.put("/release-years/:id", updateReleaseYear);
releaseYearRouter.delete("/release-years/:id", deleteReleaseYear);

export default releaseYearRouter;