import { db } from "@/db/db";
import { Request, Response } from "express";

/* Helper to serialize BigInt for JSON */
function serializeBigInt(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

/* GET DASHBOARD STATS */
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total Users
    const totalUsers = await db.user.count();
    const activeUsers = await db.user.count({
      where: {
        status: "ACTIVE",
      },
    });

    // User growth (last month vs this month)
    const lastMonthUsers = await db.user.count({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: startOfMonth,
        },
      },
    });

    const thisMonthUsers = await db.user.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    const userGrowth = lastMonthUsers > 0 
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 
      : 0;

    // Revenue Stats
    const totalRevenue = await db.payment.aggregate({
      where: {
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    const monthlyRevenue = await db.payment.aggregate({
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

    const lastMonthRevenue = await db.payment.aggregate({
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

    // Subscriptions
    const activeSubscriptions = await db.subscription.count({
      where: {
        status: "ACTIVE",
      },
    });

    const lastMonthSubscriptions = await db.subscription.count({
      where: {
        status: "ACTIVE",
        createdAt: {
          gte: lastMonth,
          lt: startOfMonth,
        },
      },
    });

    const thisMonthSubscriptions = await db.subscription.count({
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

    // Movies and Series
    const totalMovies = await db.movie.count();
    const totalSeries = await db.series.count();

    const moviesAddedThisMonth = await db.movie.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    const seriesAddedThisMonth = await db.series.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Views and Downloads
    const totalMovieViews = await db.movie.aggregate({
      _sum: {
        viewsCount: true,
      },
    });

    const totalSeriesViews = await db.series.aggregate({
      _sum: {
        viewsCount: true,
      },
    });

    const totalViews = Number(totalMovieViews._sum.viewsCount || 0) + Number(totalSeriesViews._sum.viewsCount || 0);

    const totalDownloads = await db.downloadEvent.count();

    // Revenue Data for Chart (Last 6 months)
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthRevenue = await db.payment.aggregate({
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

    // User Growth Data for Chart (Last 6 months)
    const userGrowthData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthUsers = await db.user.count({
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

    // Top Movies (by views)
    const topMovies = await db.movie.findMany({
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

    // Top Series (by views)
    const topSeries = await db.series.findMany({
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

    // Recent Transactions
    const recentTransactions = await db.payment.findMany({
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

    // Recent Users
    const recentUsers = await db.user.findMany({
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
      viewsGrowth: 0, // Calculate if needed
      downloadsGrowth: 0, // Calculate if needed
      monthlyRevenueGrowth: Math.round(revenueGrowth * 100) / 100,
      revenueData,
      userGrowthData,
      topMovies: serializeBigInt(topMovies),
      topSeries: serializeBigInt(topSeries),
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        amount: t.amount,
        status: t.status,
        createdAt: t.createdAt,
        plan: t.subscription?.plan || 'N/A',
        user: t.user,
      })),
      recentUsers,
    };

    return res.status(200).json({
      data: stats,
      error: null,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to fetch dashboard stats",
    });
  }
}

/* GET REVENUE ANALYTICS */
export async function getRevenueAnalytics(req: Request, res: Response) {
  const { period = '30d' } = req.query;

  try {
    let startDate: Date;
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

    const payments = await db.payment.findMany({
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

    // Group by payment method
    const byPaymentMethod = payments.reduce((acc: any, payment) => {
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
        dailyRevenue: payments, // Can be further processed
      },
      error: null,
    });
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to fetch revenue analytics",
    });
  }
}

/* GET USER ANALYTICS */
export async function getUserAnalytics(req: Request, res: Response) {
  try {
    const totalUsers = await db.user.count();
    
    const usersByStatus = await db.user.groupBy({
      by: ['status'],
      _count: true,
    });

    const usersByRole = await db.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const usersWithSubscriptions = await db.user.count({
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
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to fetch user analytics",
    });
  }
}

/* GET CONTENT ANALYTICS */
export async function getContentAnalytics(req: Request, res: Response) {
  try {
    const totalMovies = await db.movie.count();
    const totalSeries = await db.series.count();
    const totalEpisodes = await db.episode.count();

    const moviesByGenre = await db.movie.groupBy({
      by: ['genreId'],
      _count: true,
    });

    const seriesByGenre = await db.series.groupBy({
      by: ['genreId'],
      _count: true,
    });

    const totalMovieViews = await db.movie.aggregate({
      _sum: {
        viewsCount: true,
      },
    });

    const totalSeriesViews = await db.series.aggregate({
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
  } catch (error) {
    console.error("Error fetching content analytics:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to fetch content analytics",
    });
  }
}