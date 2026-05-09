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
exports.getAllUsers = getAllUsers;
exports.getUserByIdAdmin = getUserByIdAdmin;
exports.updateUserStatus = updateUserStatus;
exports.updateUserRole = updateUserRole;
exports.deleteUserAdmin = deleteUserAdmin;
exports.getAllPayments = getAllPayments;
exports.getAllSubscriptions = getAllSubscriptions;
exports.getAdminSettings = getAdminSettings;
exports.updateGeneralSettings = updateGeneralSettings;
exports.updatePaymentSettings = updatePaymentSettings;
const db_1 = require("../db/db");
function serializeBigInt(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) => typeof value === "bigint" ? value.toString() : value));
}
function getAllUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { page = 1, limit = 20, search = "", status = "", role = "" } = req.query;
        try {
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (search) {
                where.OR = [
                    { name: { contains: String(search), mode: "insensitive" } },
                    { email: { contains: String(search), mode: "insensitive" } },
                ];
            }
            if (status) {
                where.status = status;
            }
            if (role) {
                where.role = role;
            }
            const [users, total] = yield Promise.all([
                db_1.db.user.findMany({
                    where,
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
                    orderBy: {
                        createdAt: "desc",
                    },
                    skip,
                    take: Number(limit),
                }),
                db_1.db.user.count({ where }),
            ]);
            const [totalUsers, activeUsers, inactiveUsers, subscribers] = yield Promise.all([
                db_1.db.user.count(),
                db_1.db.user.count({ where: { status: "ACTIVE" } }),
                db_1.db.user.count({ where: { status: { not: "ACTIVE" } } }),
                db_1.db.user.count({ where: { currentPlan: { not: null } } }),
            ]);
            const totalPages = Math.ceil(total / Number(limit));
            return res.status(200).json({
                data: {
                    users,
                    stats: {
                        total: totalUsers,
                        active: activeUsers,
                        inactive: inactiveUsers,
                        subscribers,
                    },
                    totalPages,
                    currentPage: Number(page),
                    totalResults: total,
                },
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching users:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch users",
            });
        }
    });
}
function getUserByIdAdmin(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        try {
            const user = yield db_1.db.user.findUnique({
                where: { id: userId },
                include: {
                    subscriptions: {
                        orderBy: { createdAt: "desc" },
                        take: 5,
                    },
                    payments: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                    },
                    watchHistory: {
                        include: {
                            movie: true,
                            episode: {
                                include: {
                                    season: {
                                        include: {
                                            series: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: { lastWatchedAt: "desc" },
                        take: 10,
                    },
                },
            });
            if (!user) {
                return res.status(404).json({
                    data: null,
                    error: "User not found",
                });
            }
            return res.status(200).json({
                data: serializeBigInt(user),
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
function updateUserStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const { status } = req.body;
        try {
            const user = yield db_1.db.user.update({
                where: { id: userId },
                data: { status },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true,
                },
            });
            return res.status(200).json({
                data: user,
                error: null,
            });
        }
        catch (error) {
            console.error("Error updating user status:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to update user status",
            });
        }
    });
}
function updateUserRole(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const { role } = req.body;
        try {
            const user = yield db_1.db.user.update({
                where: { id: userId },
                data: { role },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            });
            return res.status(200).json({
                data: user,
                error: null,
            });
        }
        catch (error) {
            console.error("Error updating user role:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to update user role",
            });
        }
    });
}
function deleteUserAdmin(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        try {
            yield db_1.db.user.delete({
                where: { id: userId },
            });
            return res.status(200).json({
                data: null,
                message: "User deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting user:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to delete user",
            });
        }
    });
}
function getAllPayments(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { page = 1, limit = 20, status = "", method = "" } = req.query;
        try {
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (status) {
                where.status = status;
            }
            if (method) {
                where.paymentMethod = method;
            }
            const [payments, total] = yield Promise.all([
                db_1.db.payment.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        subscription: {
                            select: {
                                plan: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    skip,
                    take: Number(limit),
                }),
                db_1.db.payment.count({ where }),
            ]);
            const [totalRevenue, completed, pending, failed] = yield Promise.all([
                db_1.db.payment.aggregate({
                    where: { status: "COMPLETED" },
                    _sum: { amount: true },
                }),
                db_1.db.payment.count({ where: { status: "COMPLETED" } }),
                db_1.db.payment.count({ where: { status: "PENDING" } }),
                db_1.db.payment.count({ where: { status: "FAILED" } }),
            ]);
            const totalPages = Math.ceil(total / Number(limit));
            return res.status(200).json({
                data: {
                    payments,
                    stats: {
                        totalRevenue: totalRevenue._sum.amount || 0,
                        completed,
                        pending,
                        failed,
                    },
                    totalPages,
                    currentPage: Number(page),
                    totalResults: total,
                },
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching payments:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch payments",
            });
        }
    });
}
function getAllSubscriptions(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { page = 1, limit = 20, status = "", plan = "" } = req.query;
        try {
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (status) {
                where.status = status;
            }
            if (plan) {
                where.plan = plan;
            }
            const [subscriptions, total] = yield Promise.all([
                db_1.db.subscription.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    skip,
                    take: Number(limit),
                }),
                db_1.db.subscription.count({ where }),
            ]);
            const [activeCount, expiredCount, cancelledCount] = yield Promise.all([
                db_1.db.subscription.count({ where: { status: "ACTIVE" } }),
                db_1.db.subscription.count({ where: { status: "EXPIRED" } }),
                db_1.db.subscription.count({ where: { status: "CANCELLED" } }),
            ]);
            const totalPages = Math.ceil(total / Number(limit));
            return res.status(200).json({
                data: {
                    subscriptions,
                    stats: {
                        active: activeCount,
                        expired: expiredCount,
                        cancelled: cancelledCount,
                        total,
                    },
                    totalPages,
                    currentPage: Number(page),
                    totalResults: total,
                },
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching subscriptions:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch subscriptions",
            });
        }
    });
}
function getAdminSettings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const settings = {
                general: {
                    siteName: "MovieChamp256",
                    siteDescription: "Your ultimate movie streaming platform",
                    supportEmail: "support@moviechamp256.com",
                    supportPhone: "+256 700 000 000",
                    maintenanceMode: false,
                    allowRegistration: true,
                },
                email: {
                    smtpHost: "",
                    smtpPort: "",
                    smtpUser: "",
                    smtpPassword: "",
                    fromEmail: "noreply@moviechamp256.com",
                    fromName: "MovieChamp256",
                },
                payment: {
                    mobileMoneyEnabled: true,
                    cardPaymentsEnabled: true,
                    paypalEnabled: true,
                    flutterwavePublicKey: "",
                    flutterwaveSecretKey: "",
                    paypalClientId: "",
                    paypalSecret: "",
                },
                security: {
                    twoFactorEnabled: false,
                    sessionTimeout: 30,
                    maxLoginAttempts: 5,
                    passwordMinLength: 8,
                },
                appearance: {
                    primaryColor: "#f97316",
                    logo: "/logo-movie- champ.jpg",
                    favicon: "/favicon.ico",
                },
            };
            return res.status(200).json({
                data: settings,
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching settings:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch settings",
            });
        }
    });
}
function updateGeneralSettings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const settings = req.body;
        try {
            return res.status(200).json({
                data: settings,
                message: "Settings updated successfully",
                error: null,
            });
        }
        catch (error) {
            console.error("Error updating settings:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to update settings",
            });
        }
    });
}
function updatePaymentSettings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const settings = req.body;
        try {
            return res.status(200).json({
                data: settings,
                message: "Payment settings updated successfully",
                error: null,
            });
        }
        catch (error) {
            console.error("Error updating payment settings:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to update payment settings",
            });
        }
    });
}
