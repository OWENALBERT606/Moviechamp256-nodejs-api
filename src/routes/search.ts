import express from "express";
import { globalSearch } from "@/controllers/search";

const searchRouter = express.Router();

// Global search
searchRouter.get("/search", globalSearch);

export default searchRouter;