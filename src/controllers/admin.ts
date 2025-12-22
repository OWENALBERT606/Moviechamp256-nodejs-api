import { db } from "@/db/db";
import { Request, Response } from "express";

/* Helper to serialize BigInt */
function serializeBigInt(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

/* ---------------------------------- Get All Users ---------------------------------- */

export async function getAllUsers(req: Request, res: Response) {
  const { page = 1, limit = 20, search = "", status = "", role = "" } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};

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

    // Get users with pagination
    const [users, total] = await Promise.all([
      db.user.findMany({
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
      db.user.count({ where }),
    ]);

    // Get stats
    const [totalUsers, activeUsers, inactiveUsers, subscribers] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: "ACTIVE" } }),
      db.user.count({ where: { status: { not: "ACTIVE" } } }),
      db.user.count({ where: { currentPlan: { not: null } } }),
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
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to fetch users",
    });
  }
}

/* ---------------------------------- Get User By ID ---------------------------------- */

export async function getUserByIdAdmin(req: Request, res: Response) {
  const { userId } = req.params;

  try {
    const user = await db.user.findUnique({
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
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to fetch user",
    });
  }
}

/* ---------------------------------- Update User Status ---------------------------------- */

export async function updateUserStatus(req: Request, res: Response) {
  const { userId } = req.params;
  const { status } = req.body;

  try {
    const user = await db.user.update({
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
  } catch (error) {
    console.error("Error updating user status:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to update user status",
    });
  }
}

/* ---------------------------------- Update User Role ---------------------------------- */

export async function updateUserRole(req: Request, res: Response) {
  const { userId } = req.params;
  const { role } = req.body;

  try {
    const user = await db.user.update({
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
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to update user role",
    });
  }
}

/* ---------------------------------- Delete User ---------------------------------- */

export async function deleteUserAdmin(req: Request, res: Response) {
  const { userId } = req.params;

  try {
    await db.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({
      data: null,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to delete user",
    });
  }
}

/* ---------------------------------- Get All Payments ---------------------------------- */

export async function getAllPayments(req: Request, res: Response) {
  const { page = 1, limit = 20, status = "", method = "" } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (method) {
      where.paymentMethod = method;
    }

    // Get payments with pagination
    const [payments, total] = await Promise.all([
      db.payment.findMany({
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
      db.payment.count({ where }),
    ]);

    // Get stats
    const [totalRevenue, completed, pending, failed] = await Promise.all([
      db.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      db.payment.count({ where: { status: "COMPLETED" } }),
      db.payment.count({ where: { status: "PENDING" } }),
      db.payment.count({ where: { status: "FAILED" } }),
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
  } catch (error) {
    console.error("Error fetching payments:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to fetch payments",
    });
  }
}

/* ---------------------------------- Get All Subscriptions ---------------------------------- */

export async function getAllSubscriptions(req: Request, res: Response) {
  const { page = 1, limit = 20, status = "", plan = "" } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (plan) {
      where.plan = plan;
    }

    // Get subscriptions with pagination
    const [subscriptions, total] = await Promise.all([
      db.subscription.findMany({
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
      db.subscription.count({ where }),
    ]);

    // Get stats
    const [activeCount, expiredCount, cancelledCount] = await Promise.all([
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.subscription.count({ where: { status: "EXPIRED" } }),
      db.subscription.count({ where: { status: "CANCELLED" } }),
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
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to fetch subscriptions",
    });
  }
}

/* ---------------------------------- Get Admin Settings ---------------------------------- */

export async function getAdminSettings(req: Request, res: Response) {
  try {
    // In a real app, these would come from a settings table
    // For now, return mock data
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
  } catch (error) {
    console.error("Error fetching settings:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to fetch settings",
    });
  }
}

/* ---------------------------------- Update Settings ---------------------------------- */

export async function updateGeneralSettings(req: Request, res: Response) {
  const settings = req.body;

  try {
    // In a real app, save to settings table
    // For now, just return success
    
    return res.status(200).json({
      data: settings,
      message: "Settings updated successfully",
      error: null,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to update settings",
    });
  }
}

export async function updatePaymentSettings(req: Request, res: Response) {
  const settings = req.body;

  try {
    // In a real app, save to settings table
    // For now, just return success
    
    return res.status(200).json({
      data: settings,
      message: "Payment settings updated successfully",
      error: null,
    });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to update payment settings",
    });
  }
}