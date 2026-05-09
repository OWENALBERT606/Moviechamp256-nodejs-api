"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vj_1 = require("../controllers/vj");
const vjRouter = express_1.default.Router();
vjRouter.get("/vjs", vj_1.getAllVJs);
vjRouter.get("/vjs/:id", vj_1.getVJById);
vjRouter.get("/vjs/name/:name", vj_1.getVJByName);
vjRouter.post("/vjs", vj_1.createVJ);
vjRouter.put("/vjs/:id", vj_1.updateVJ);
vjRouter.delete("/vjs/:id", vj_1.deleteVJ);
exports.default = vjRouter;
