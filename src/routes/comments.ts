import express from "express";
import { getComments, createComment, deleteComment } from "@/controllers/comments";

const commentRouter = express.Router();

commentRouter.get("/comments/:type/:id", getComments);
commentRouter.post("/comments", createComment);
commentRouter.delete("/comments/:id", deleteComment);

export default commentRouter;
