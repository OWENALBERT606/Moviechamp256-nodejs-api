"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboard_1 = require("../controllers/dashboard");
const dashboardRouter = express_1.default.Router();
dashboardRouter.get("/dashboard/stats", dashboard_1.getDashboardStats);
dashboardRouter.get("/dashboard/revenue-analytics", dashboard_1.getRevenueAnalytics);
dashboardRouter.get("/dashboard/user-analytics", dashboard_1.getUserAnalytics);
dashboardRouter.get("/dashboard/content-analytics", dashboard_1.getContentAnalytics);
exports.default = dashboardRouter;
