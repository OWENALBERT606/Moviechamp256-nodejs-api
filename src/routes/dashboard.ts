import express from "express";
import {
  getDashboardStats,
  getRevenueAnalytics,
  getUserAnalytics,
  getContentAnalytics,
} from "@/controllers/dashboard";

const dashboardRouter = express.Router();

// Main dashboard stats
dashboardRouter.get("/dashboard/stats", getDashboardStats);

// Analytics endpoints
dashboardRouter.get("/dashboard/revenue-analytics", getRevenueAnalytics);
dashboardRouter.get("/dashboard/user-analytics", getUserAnalytics);
dashboardRouter.get("/dashboard/content-analytics", getContentAnalytics);

export default dashboardRouter;