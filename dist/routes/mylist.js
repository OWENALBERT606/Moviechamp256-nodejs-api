"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mylists_1 = require("../controllers/mylists");
const express_1 = __importDefault(require("express"));
const myListRouter = express_1.default.Router();
myListRouter.get("/mylist/:userId", mylists_1.getMyList);
myListRouter.get("/mylist/:userId/stats", mylists_1.getMyListStats);
myListRouter.get("/mylist/check", mylists_1.checkInMyList);
myListRouter.post("/mylist", mylists_1.addToMyList);
myListRouter.delete("/mylist", mylists_1.removeFromMyList);
exports.default = myListRouter;
