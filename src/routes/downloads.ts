import express from "express";
import { authenticateToken } from "@/utils/auth";
import { checkDownloadLimit, recordDownload } from "@/controllers/downloads";

const downloadRouter = express.Router();

// All download routes require authentication
downloadRouter.get("/downloads/check-limit", authenticateToken, checkDownloadLimit);
downloadRouter.post("/downloads/record", authenticateToken, recordDownload);

export default downloadRouter;
