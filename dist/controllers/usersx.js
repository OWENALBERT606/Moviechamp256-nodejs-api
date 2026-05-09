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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = getUserById;
exports.updateUserProfile = updateUserProfile;
exports.changePassword = changePassword;
exports.deleteAccount = deleteAccount;
exports.getUserStatistics = getUserStatistics;
const db_1 = require("../db/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
function getUserById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        try {
            const user = yield db_1.db.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    imageUrl: true,
                    role: true,
                    status: true,
                    currentPlan: true,
                    planExpiresAt: true,
                    createdAt: true,
                },
            });
            if (!user) {
                return res.status(404).json({
                    data: null,
                    error: "User not found",
                });
            }
            return res.status(200).json({
                data: user,
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching user:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch user",
            });
        }
    });
}
function updateUserProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const { firstName, lastName, name, email, phone } = req.body;
        try {
            const user = yield db_1.db.user.update({
                where: { id: userId },
                data: {
                    firstName,
                    lastName,
                    name,
                    email,
                    phone,
                },
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    imageUrl: true,
                },
            });
            return res.status(200).json({
                data: user,
                error: null,
            });
        }
        catch (error) {
            console.error("Error updating profile:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to update profile",
            });
        }
    });
}
function changePassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const { currentPassword, newPassword } = req.body;
        try {
            const user = yield db_1.db.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return res.status(404).json({
                    data: null,
                    error: "User not found",
                });
            }
            const isValid = yield bcryptjs_1.default.compare(currentPassword, user.password);
            if (!isValid) {
                return res.status(400).json({
                    data: null,
                    error: "Current password is incorrect",
                });
            }
            const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
            yield db_1.db.user.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });
            return res.status(200).json({
                data: null,
                message: "Password changed successfully",
            });
        }
        catch (error) {
            console.error("Error changing password:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to change password",
            });
        }
    });
}
function deleteAccount(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const { password } = req.body;
        try {
            const user = yield db_1.db.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return res.status(404).json({
                    data: null,
                    error: "User not found",
                });
            }
            const isValid = yield bcryptjs_1.default.compare(password, user.password);
            if (!isValid) {
                return res.status(400).json({
                    data: null,
                    error: "Password is incorrect",
                });
            }
            yield db_1.db.user.delete({
                where: { id: userId },
            });
            return res.status(200).json({
                data: null,
                message: "Account deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting account:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to delete account",
            });
        }
    });
}
function getUserStatistics(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        try {
            const [watchHistoryCount, subscriptionsCount, listItems] = yield Promise.all([
                db_1.db.watchHistory.count({ where: { userId } }),
                db_1.db.subscription.count({ where: { userId, status: "ACTIVE" } }),
                db_1.db.myList.findUnique({
                    where: { userId },
                    include: {
                        _count: {
                            select: {
                                movies: true,
                                series: true,
                            },
                        },
                    },
                }),
            ]);
            const stats = {
                watchedItems: watchHistoryCount,
                activeSubscriptions: subscriptionsCount,
                savedItems: ((listItems === null || listItems === void 0 ? void 0 : listItems._count.movies) || 0) + ((listItems === null || listItems === void 0 ? void 0 : listItems._count.series) || 0),
            };
            return res.status(200).json({
                data: stats,
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching statistics:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch statistics",
            });
        }
    });
}
