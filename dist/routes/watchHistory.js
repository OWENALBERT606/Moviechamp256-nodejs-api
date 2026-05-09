"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wathchistory_1 = require("../controllers/wathchistory");
const express_1 = __importDefault(require("express"));
const watchHistoryRouter = express_1.default.Router();
watchHistoryRouter.get("/watchhistory/:userId", wathchistory_1.getWatchHistory);
watchHistoryRouter.get("/watchhistory/:userId/continue", wathchistory_1.getContinueWatching);
watchHistoryRouter.get("/watchhistory/progress", wathchistory_1.getWatchProgress);
watchHistoryRouter.post("/watchhistory", wathchistory_1.updateWatchProgress);
watchHistoryRouter.delete("/watchhistory/:id", wathchistory_1.deleteWatchHistoryItem);
watchHistoryRouter.delete("/watchhistory/:userId/clear", wathchistory_1.clearWatchHistory);
exports.default = watchHistoryRouter;
