import { addToMyList, checkInMyList, getMyList, getMyListStats, removeFromMyList } from "@/controllers/mylists";
import express from "express";


const myListRouter = express.Router();

// Get user's list (with optional type filter)
myListRouter.get("/mylist/:userId", getMyList);

// Get user's list stats
myListRouter.get("/mylist/:userId/stats", getMyListStats);

// Check if item is in user's list
myListRouter.get("/mylist/check", checkInMyList);

// Add item to user's list
myListRouter.post("/mylist", addToMyList);

// Remove item from user's list
myListRouter.delete("/mylist", removeFromMyList);

export default myListRouter;