import express from "express";
import {
  getUserById,
  updateUserProfile,
  changePassword,
  deleteAccount,
  getUserStatistics,
} from "@/controllers/usersx";
import userRouter from "./users";

const userxRouter = express.Router();

// Get user by ID
userxRouter.get("/users/:userId", getUserById);

// Update user profile
userxRouter.put("/users/:userId", updateUserProfile);

// Change password
userxRouter.post("/users/:userId/change-password", changePassword);

// Delete account
userxRouter.post("/users/:userId/delete", deleteAccount);

// Get user statistics
userxRouter.get("/users/:userId/statistics", getUserStatistics);

export default userxRouter;