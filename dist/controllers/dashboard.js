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
exports.getDashboardStats = getDashboardStats;
exports.getRevenueAnalytics = getRevenueAnalytics;
exports.getUserAnalytics = getUserAnalytics;
exports.getContentAnalytics = getContentAnalytics;
const db_1 = require("../db/db");
function serializeBigInt(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) => typeof value === "bigint" ? value.toString() : value));
}
function getDashboardStats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const totalUsers = yield db_1.db.user.count();
            const activeUsers = yield db_1.db.user.count({
                where: {
                    status: "ACTIVE",
                },
            });
            const lastMonthUsers = yield db_1.db.user.count({
                where: {
                    createdAt: {
                        gte: lastMonth,
                        lt: startOfMonth,
                    },
                },
            });
            const thisMonthUsers = yield db_1.db.user.count({
                where: {
                    createdAt: {
                        gte: startOfMonth,
                    },
                },
            });
            const userGrowth = lastMonthUsers > 0
                ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
                : 0;
            const totalRevenue = yield db_1.db.payment.aggregate({
                where: {
                    status: "COMPLETED",
                },
                _sum: {
                    amount: true,
                },
            });
            const monthlyRevenue = yield db_1.db.payment.aggregate({
                where: {
                    status: "COMPLETED",
                    createdAt: {
                        gte: startOfMonth,
                    },
                },
                _sum: {
                    amount: true,
                },
            });
            const lastMonthRevenue = yield db_1.db.payment.aggregate({
                where: {
                    status: "COMPLETED",
                    createdAt: {
                        gte: lastMonth,
                        lt: startOfMonth,
                    },
                },
                _sum: {
                    amount: true,
                },
            });
            const revenueGrowth = (lastMonthRevenue._sum.amount || 0) > 0
                ? (((monthlyRevenue._sum.amount || 0) - (lastMonthRevenue._sum.amount || 0)) / (lastMonthRevenue._sum.amount || 0)) * 100
                : 0;
            const activeSubscriptions = yield db_1.db.subscription.count({
                where: {
                    status: "ACTIVE",
                },
            });
            const lastMonthSubscriptions = yield db_1.db.subscription.count({
                where: {
                    status: "ACTIVE",
                    createdAt: {
                        gte: lastMonth,
                        lt: startOfMonth,
                    },
                },
            });
            const thisMonthSubscriptions = yield db_1.db.subscription.count({
                where: {
                    status: "ACTIVE",
                    createdAt: {
                        gte: startOfMonth,
                    },
                },
            });
            const subscriptionGrowth = lastMonthSubscriptions > 0
                ? ((thisMonthSubscriptions - lastMonthSubscriptions) / lastMonthSubscriptions) * 100
                : 0;
            const totalMovies = yield db_1.db.movie.count();
            const totalSeries = yield db_1.db.series.count();
            const moviesAddedThisMonth = yield db_1.db.movie.count({
                where: {
                    createdAt: {
                        gte: startOfMonth,
                    },
                },
            });
            const seriesAddedThisMonth = yield db_1.db.series.count({
                where: {
                    createdAt: {
                        gte: startOfMonth,
                    },
                },
            });
            const totalMovieViews = yield db_1.db.movie.aggregate({
                _sum: {
                    viewsCount: true,
                },
            });
            const totalSeriesViews = yield db_1.db.series.aggregate({
                _sum: {
                    viewsCount: true,
                },
            });
            const totalViews = Number(totalMovieViews._sum.viewsCount || 0) + Number(totalSeriesViews._sum.viewsCount || 0);
            const totalDownloads = yield db_1.db.downloadEvent.count();
            const revenueData = [];
            for (let i = 5; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
                const monthRevenue = yield db_1.db.payment.aggregate({
                    where: {
                        status: "COMPLETED",
                        createdAt: {
                            gte: monthStart,
                            lt: monthEnd,
                        },
                    },
                    _sum: {
                        amount: true,
                    },
                });
                revenueData.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                    revenue: monthRevenue._sum.amount || 0,
                });
            }
            const userGrowthData = [];
            for (let i = 5; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
                const monthUsers = yield db_1.db.user.count({
                    where: {
                        createdAt: {
                            gte: monthStart,
                            lt: monthEnd,
                        },
                    },
                });
                userGrowthData.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                    users: monthUsers,
                });
            }
            const topMovies = yield db_1.db.movie.findMany({
                select: {
                    id: true,
                    title: true,
                    poster: true,
                    viewsCount: true,
                    rating: true,
                    slug: true,
                },
                orderBy: {
                    viewsCount: 'desc',
                },
                take: 5,
            });
            const topSeries = yield db_1.db.series.findMany({
                select: {
                    id: true,
                    title: true,
                    poster: true,
                    viewsCount: true,
                    rating: true,
                    slug: true,
                },
                orderBy: {
                    viewsCount: 'desc',
                },
                take: 5,
            });
            const recentTransactions = yield db_1.db.payment.findMany({
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    createdAt: true,
                    subscription: {
                        select: {
                            plan: true,
                        },
                    },
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 5,
            });
            const recentUsers = yield db_1.db.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    imageUrl: true,
                    currentPlan: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 5,
            });
            const stats = {
                totalRevenue: totalRevenue._sum.amount || 0,
                monthlyRevenue: monthlyRevenue._sum.amount || 0,
                revenueGrowth: Math.round(revenueGrowth * 100) / 100,
                activeUsers,
                totalUsers,
                userGrowth: Math.round(userGrowth * 100) / 100,
                activeSubscriptions,
                subscriptionGrowth: Math.round(subscriptionGrowth * 100) / 100,
                totalMovies,
                totalSeries,
                moviesAdded: moviesAddedThisMonth,
                seriesAdded: seriesAddedThisMonth,
                totalViews,
                totalDownloads,
                viewsGrowth: 0,
                downloadsGrowth: 0,
                monthlyRevenueGrowth: Math.round(revenueGrowth * 100) / 100,
                revenueData,
                userGrowthData,
                topMovies: serializeBigInt(topMovies),
                topSeries: serializeBigInt(topSeries),
                recentTransactions: recentTransactions.map(t => {
                    var _a;
                    return ({
                        id: t.id,
                        amount: t.amount,
                        status: t.status,
                        createdAt: t.createdAt,
                        plan: ((_a = t.subscription) === null || _a === void 0 ? void 0 : _a.plan) || 'N/A',
                        user: t.user,
                    });
                }),
                recentUsers,
            };
            return res.status(200).json({
                data: stats,
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching dashboard stats:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch dashboard stats",
            });
        }
    });
}
function getRevenueAnalytics(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { period = '30d' } = req.query;
        try {
            let startDate;
            const now = new Date();
            switch (period) {
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '90d':
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case '1y':
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }
            const payments = yield db_1.db.payment.findMany({
                where: {
                    status: "COMPLETED",
                    createdAt: {
                        gte: startDate,
                    },
                },
                select: {
                    amount: true,
                    createdAt: true,
                    paymentMethod: true,
                },
            });
            const byPaymentMethod = payments.reduce((acc, payment) => {
                const method = payment.paymentMethod;
                if (!acc[method]) {
                    acc[method] = { method, total: 0, count: 0 };
                }
                acc[method].total += payment.amount;
                acc[method].count += 1;
                return acc;
            }, {});
            return res.status(200).json({
                data: {
                    totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
                    totalTransactions: payments.length,
                    byPaymentMethod: Object.values(byPaymentMethod),
                    dailyRevenue: payments,
                },
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching revenue analytics:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch revenue analytics",
            });
        }
    });
}
function getUserAnalytics(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const totalUsers = yield db_1.db.user.count();
            const usersByStatus = yield db_1.db.user.groupBy({
                by: ['status'],
                _count: true,
            });
            const usersByRole = yield db_1.db.user.groupBy({
                by: ['role'],
                _count: true,
            });
            const usersWithSubscriptions = yield db_1.db.user.count({
                where: {
                    currentPlan: {
                        not: null,
                    },
                },
            });
            return res.status(200).json({
                data: {
                    totalUsers,
                    usersByStatus,
                    usersByRole,
                    usersWithSubscriptions,
                    subscriptionRate: (usersWithSubscriptions / totalUsers) * 100,
                },
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching user analytics:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch user analytics",
            });
        }
    });
}
function getContentAnalytics(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const totalMovies = yield db_1.db.movie.count();
            const totalSeries = yield db_1.db.series.count();
            const totalEpisodes = yield db_1.db.episode.count();
            const moviesByGenre = yield db_1.db.movie.groupBy({
                by: ['genreId'],
                _count: true,
            });
            const seriesByGenre = yield db_1.db.series.groupBy({
                by: ['genreId'],
                _count: true,
            });
            const totalMovieViews = yield db_1.db.movie.aggregate({
                _sum: {
                    viewsCount: true,
                },
            });
            const totalSeriesViews = yield db_1.db.series.aggregate({
                _sum: {
                    viewsCount: true,
                },
            });
            return res.status(200).json({
                data: {
                    totalMovies,
                    totalSeries,
                    totalEpisodes,
                    moviesByGenre,
                    seriesByGenre,
                    totalMovieViews: totalMovieViews._sum.viewsCount || 0,
                    totalSeriesViews: totalSeriesViews._sum.viewsCount || 0,
                },
                error: null,
            });
        }
        catch (error) {
            console.error("Error fetching content analytics:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch content analytics",
            });
        }
    });
}
