import express from "express";
import {
  getAllUsers,
  getUserByIdAdmin,
  updateUserStatus,
  updateUserRole,
  deleteUserAdmin,
  getAllPayments,
  getAllSubscriptions,
  getAdminSettings,
  updateGeneralSettings,
  updatePaymentSettings,
} from "@/controllers/admin";

const adminRouter = express.Router();

// Users management
adminRouter.get("/admin/users", getAllUsers);
adminRouter.get("/admin/users/:userId", getUserByIdAdmin);
adminRouter.patch("/admin/users/:userId/status", updateUserStatus);
adminRouter.patch("/admin/users/:userId/role", updateUserRole);
adminRouter.delete("/admin/users/:userId", deleteUserAdmin);

// Payments management
adminRouter.get("/admin/payments", getAllPayments);

// Subscriptions management
adminRouter.get("/admin/subscriptions", getAllSubscriptions);

// Settings management
adminRouter.get("/admin/settings", getAdminSettings);
adminRouter.put("/admin/settings/general", updateGeneralSettings);
adminRouter.put("/admin/settings/payment", updatePaymentSettings);

export default adminRouter;