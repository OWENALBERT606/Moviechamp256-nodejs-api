"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComments = getComments;
exports.createComment = createComment;
exports.deleteComment = deleteComment;
const db_1 = require("../db/db");
function getComments(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { type, id } = req.params;
        try {
            const comments = yield db_1.db.comment.findMany({
                where: {
                    [type === "movie" ? "movieId" : "seriesId"]: id,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            return res.status(200).json({ data: comments });
        }
        catch (error) {
            console.error("Fetch comments error:", error);
            return res.status(500).json({ error: "Failed to fetch comments" });
        }
    });
}
function createComment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { content, userId, type, itemId } = req.body;
        if (!content || !userId || !type || !itemId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        try {
            const comment = yield db_1.db.comment.create({
                data: {
                    content,
                    userId,
                    [type === "movie" ? "movieId" : "seriesId"]: itemId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                        },
                    },
                },
            });
            return res.status(201).json({ data: comment });
        }
        catch (error) {
            console.error("Create comment error:", error);
            return res.status(500).json({ error: "Failed to post comment" });
        }
    });
}
function deleteComment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { userId } = req.body;
        try {
            const comment = yield db_1.db.comment.findUnique({
                where: { id },
            });
            if (!comment) {
                return res.status(404).json({ error: "Comment not found" });
            }
            if (comment.userId !== userId) {
                return res.status(403).json({ error: "Unauthorized to delete this comment" });
            }
            yield db_1.db.comment.delete({
                where: { id },
            });
            return res.status(200).json({ message: "Comment deleted" });
        }
        catch (error) {
            console.error("Delete comment error:", error);
            return res.status(500).json({ error: "Failed to delete comment" });
        }
    });
}
