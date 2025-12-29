import { db } from "@/db/db";
import { Request, Response } from "express";

/* Helper to calculate subscription end date */
function calculateEndDate(planId: string): Date {
  const now = new Date();
  const durations: Record<string, number> = {
    daily: 1,
    weekly: 7,
    monthly: 30,
    quarterly: 90,
    semiannual: 180,
    annual: 365,
  };
  
  const days = durations[planId] || 30;
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + days);
  
  return endDate;
}

/* Map plan ID to enum */
function getPlanEnum(planId: string): any {
  const mapping: Record<string, string> = {
    daily: "DAILY",
    weekly: "WEEKLY",
    monthly: "MONTHLY",
    quarterly: "QUARTERLY",
    semiannual: "SEMI_ANNUAL",
    annual: "ANNUAL",
  };
  
  return mapping[planId] || "MONTHLY";
}

/* ---------------------------------- Mobile Money Payment ---------------------------------- */

export async function processMobileMoneyPayment(req: Request, res: Response) {
  const { userId, planId, amount, phoneNumber, provider } = req.body;

  try {
    // Validate inputs
    if (!userId || !planId || !amount || !phoneNumber || !provider) {
      return res.status(400).json({
        data: null,
        error: "Missing required fields",
      });
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId,
        amount,
        currency: "UGX",
        paymentMethod: "MOBILE_MONEY",
        status: "PENDING",
        phoneNumber,
      },
    });

    // Create subscription record
    const subscription = await db.subscription.create({
      data: {
        userId,
        plan: getPlanEnum(planId),
        status: "PENDING",
        amount,
        currency: "UGX",
        endDate: calculateEndDate(planId),
      },
    });

    // Link payment to subscription
    await db.payment.update({
      where: { id: payment.id },
      data: { subscriptionId: subscription.id },
    });

    // TODO: Integrate with actual Mobile Money API (Flutterwave, Paystack, etc.)
    // For now, we'll simulate the payment request
    
    const mockTransactionId = `MM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Update payment with transaction ID
    await db.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: mockTransactionId,
        status: "PROCESSING",
      },
    });

    return res.status(200).json({
      data: {
        paymentId: payment.id,
        transactionId: mockTransactionId,
        message: "Payment initiated. Please check your phone to complete the transaction.",
      },
      error: null,
    });
  } catch (error) {
    console.error("Mobile money payment error:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to process mobile money payment",
    });
  }
}

/* ---------------------------------- Card Payment ---------------------------------- */

export async function processCardPayment(req: Request, res: Response) {
  const { userId, planId, amount, cardNumber, cardName, expiryDate, cvv } = req.body;

  try {
    // Validate inputs
    if (!userId || !planId || !amount || !cardNumber || !cardName || !expiryDate || !cvv) {
      return res.status(400).json({
        data: null,
        error: "Missing required fields",
      });
    }

    // Get last 4 digits of card
    const cardLast4 = cardNumber.slice(-4);

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId,
        amount,
        currency: "UGX",
        paymentMethod: "BANK_CARD",
        status: "PENDING",
        cardLast4,
      },
    });

    // Create subscription record
    const subscription = await db.subscription.create({
      data: {
        userId,
        plan: getPlanEnum(planId),
        status: "PENDING",
        amount,
        currency: "UGX",
        endDate: calculateEndDate(planId),
      },
    });

    // Link payment to subscription
    await db.payment.update({
      where: { id: payment.id },
      data: { subscriptionId: subscription.id },
    });

    // TODO: Integrate with actual Payment Gateway (Flutterwave, Paystack, Stripe)
    // For now, we'll simulate successful payment
    
    const mockTransactionId = `CARD${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Update payment and subscription as completed
    await db.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: mockTransactionId,
        status: "COMPLETED",
        paidAt: new Date(),
      },
    });

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        startDate: new Date(),
      },
    });

    // Update user's current plan
    await db.user.update({
      where: { id: userId },
      data: {
        currentPlan: getPlanEnum(planId),
        planExpiresAt: calculateEndDate(planId),
      },
    });

    return res.status(200).json({
      data: {
        paymentId: payment.id,
        transactionId: mockTransactionId,
        message: "Payment successful!",
      },
      error: null,
    });
  } catch (error) {
    console.error("Card payment error:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to process card payment",
    });
  }
}

/* ---------------------------------- PayPal Payment ---------------------------------- */

export async function processPayPalPayment(req: Request, res: Response) {
  const { userId, planId, amount, email, returnUrl, cancelUrl } = req.body;

  try {
    // Validate inputs
    if (!userId || !planId || !amount || !email) {
      return res.status(400).json({
        data: null,
        error: "Missing required fields",
      });
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId,
        amount,
        currency: "UGX",
        paymentMethod: "PAYPAL",
        status: "PENDING",
      },
    });

    // Create subscription record
    const subscription = await db.subscription.create({
      data: {
        userId,
        plan: getPlanEnum(planId),
        status: "PENDING",
        amount,
        currency: "UGX",
        endDate: calculateEndDate(planId),
      },
    });

    // Link payment to subscription
    await db.payment.update({
      where: { id: payment.id },
      data: { subscriptionId: subscription.id },
    });

    // TODO: Integrate with actual PayPal API
    // For now, generate a mock approval URL
    const mockApprovalUrl = `${returnUrl}?paymentId=${payment.id}&status=success`;

    return res.status(200).json({
      data: {
        paymentId: payment.id,
        approvalUrl: mockApprovalUrl,
      },
      error: null,
    });
  } catch (error) {
    console.error("PayPal payment error:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to initialize PayPal payment",
    });
  }
}

/* ---------------------------------- Get Payment Status ---------------------------------- */

export async function getPaymentStatus(req: Request, res: Response) {
  const { paymentId } = req.params;

  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        data: null,
        error: "Payment not found",
      });
    }

    return res.status(200).json({
      data: payment,
      error: null,
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to fetch payment status",
    });
  }
}

/* ---------------------------------- Verify Payment ---------------------------------- */

export async function verifyPayment(req: Request, res: Response) {
  const { paymentId } = req.params;

  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });

    if (!payment) {
      return res.status(404).json({
        data: null,
        error: "Payment not found",
      });
    }

    // TODO: Verify with actual payment gateway

    // For now, mark as completed if pending
    if (payment.status === "PENDING" || payment.status === "PROCESSING") {
      await db.payment.update({
        where: { id: paymentId },
        data: {
          status: "COMPLETED",
          paidAt: new Date(),
        },
      });

      if (payment.subscriptionId) {
        await db.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: "ACTIVE",
            startDate: new Date(),
          },
        });

        // Update user's current plan
        await db.user.update({
          where: { id: payment.userId },
          data: {
            currentPlan: payment.subscription?.plan,
            planExpiresAt: payment.subscription?.endDate,
          },
        });
      }
    }

    return res.status(200).json({
      data: { verified: true, status: "COMPLETED" },
      error: null,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      data: null,
      error: "Failed to verify payment",
    });
  }
}