"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usersx_1 = require("../controllers/usersx");
const userxRouter = express_1.default.Router();
userxRouter.get("/users/:userId", usersx_1.getUserById);
userxRouter.put("/users/:userId", usersx_1.updateUserProfile);
userxRouter.post("/users/:userId/change-password", usersx_1.changePassword);
userxRouter.post("/users/:userId/delete", usersx_1.deleteAccount);
userxRouter.get("/users/:userId/statistics", usersx_1.getUserStatistics);
exports.default = userxRouter;
