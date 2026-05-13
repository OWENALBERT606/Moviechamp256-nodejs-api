"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../utils/auth");
const downloads_1 = require("../controllers/downloads");
const downloadRouter = express_1.default.Router();
downloadRouter.get("/downloads/check-limit", auth_1.authenticateToken, downloads_1.checkDownloadLimit);
downloadRouter.post("/downloads/record", auth_1.authenticateToken, downloads_1.recordDownload);
exports.default = downloadRouter;
