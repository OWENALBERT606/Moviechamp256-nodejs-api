"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const comments_1 = require("../controllers/comments");
const commentRouter = express_1.default.Router();
commentRouter.get("/comments/:type/:id", comments_1.getComments);
commentRouter.post("/comments", comments_1.createComment);
commentRouter.delete("/comments/:id", comments_1.deleteComment);
exports.default = commentRouter;
