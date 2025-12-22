import { db } from "@/db/db";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";

/* Get User By ID */
export async function getUserById(req: Request, res: Response) {
  const { userId } = req.params;

  try {
    const user = await db.user.findUnique({
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
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to fetch user",
    });
  }
}

/* Update User Profile */
export async function updateUserProfile(req: Request, res: Response) {
  const { userId } = req.params;
  const { firstName, lastName, name, email, phone } = req.body;

  try {
    const user = await db.user.update({
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
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to update profile",
    });
  }
}

/* Change Password */
export async function changePassword(req: Request, res: Response) {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    // Get user with password
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        data: null,
        error: "User not found",
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({
        data: null,
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      data: null,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to change password",
    });
  }
}

/* Delete Account */
export async function deleteAccount(req: Request, res: Response) {
  const { userId } = req.params;
  const { password } = req.body;

  try {
    // Get user with password
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        data: null,
        error: "User not found",
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({
        data: null,
        error: "Password is incorrect",
      });
    }

    // Delete user (cascades to all related data)
    await db.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({
      data: null,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to delete account",
    });
  }
}

/* Get User Statistics */
export async function getUserStatistics(req: Request, res: Response) {
  const { userId } = req.params;

  try {
    const [watchHistoryCount, subscriptionsCount, listItems] = await Promise.all([
      db.watchHistory.count({ where: { userId } }),
      db.subscription.count({ where: { userId, status: "ACTIVE" } }),
      db.myList.findUnique({
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
      savedItems: (listItems?._count.movies || 0) + (listItems?._count.series || 0),
    };

    return res.status(200).json({
      data: stats,
      error: null,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to fetch statistics",
    });
  }
}