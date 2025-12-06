import express from "express";
import {
  createVJ,
  getAllVJs,
  getVJById,
  getVJByName,
  updateVJ,
  deleteVJ,
} from "@/controllers/vj";

const vjRouter = express.Router();

// All routes are public - no authentication required
vjRouter.get("/vjs", getAllVJs);
vjRouter.get("/vjs/:id", getVJById);
vjRouter.get("/vjs/name/:name", getVJByName);
vjRouter.post("/vjs", createVJ);
vjRouter.put("/vjs/:id", updateVJ);
vjRouter.delete("/vjs/:id", deleteVJ);

export default vjRouter;