import { db } from "@/db/db";
import { invalidatePattern } from "@/utils/cache";
import { Request, Response } from "express";
import {
  requestPayment,
  validatePhone,
  getTransactionByReference,
  normalizeMsisdn,
} from "@/services/relworx.service";

/* ── Helpers ── */

function calculateEndDate(planId: string): Date {
  const durations: Record<string, number> = {
    daily: 1,
    weekly: 7,
    two_weeks: 14,
    monthly: 30,
    quarterly: 90,
    semiannual: 180,
    annual: 365,
  };
  const end = new Date();
  end.setDate(end.getDate() + (durations[planId] ?? 30));
  return end;
}

function getPlanEnum(planId: string): any {
  const mapping: Record<string, string> = {
    daily: "DAILY",
    weekly: "WEEKLY",
    two_weeks: "TWO_WEEKS",
    monthly: "MONTHLY",
    quarterly: "QUARTERLY",
    semiannual: "SEMI_ANNUAL",
    annual: "ANNUAL",
  };
  return mapping[planId] ?? "MONTHLY";
}

/* Activate subscription and update user plan — shared by webhook and verify */
async function activateSubscription(
  paymentId: string,
  subscriptionId: string,
  userId: string,
  planId: string | null,
  providerTxId?: string
) {
  await db.payment.update({
    where: { id: paymentId },
    data: {
      status: "COMPLETED",
      paidAt: new Date(),
      ...(providerTxId ? { gatewayResponse: { provider_transaction_id: providerTxId } } : {}),
    },
  });

  const subscription = await db.subscription.update({
    where: { id: subscriptionId },
    data: { status: "ACTIVE", startDate: new Date() },
  });

  await db.user.update({
    where: { id: userId },
    data: {
      currentPlan: subscription.plan,
      planExpiresAt: subscription.endDate,
    },
  });

  await invalidatePattern(`access:${userId}:*`);
  await invalidatePattern(`stream-url:${userId}:*`);
}

/* ────────────────────────────────────────────────────────────
   POST /payments/mobile-money
   Sends a Relworx STK push to the customer's phone.
──────────────────────────────────────────────────────────── */
export async function processMobileMoneyPayment(req: Request, res: Response) {
  const { userId, planId, amount, phoneNumber, provider } = req.body;

  if (!userId || !planId || !amount || !phoneNumber) {
    return res.status(400).json({ data: null, error: "Missing required fields" });
  }

  try {
    const msisdn = normalizeMsisdn(phoneNumber);

    // Validate phone number with Relworx before charging
    let customerName: string | undefined;
    try {
      const validation = await validatePhone(msisdn);
      if (!validation.success) {
        return res.status(400).json({
          data: null,
          error: "Phone number is not valid for mobile money. Please check and try again.",
        });
      }
      customerName = validation.customer_name;
    } catch {
      // Validation endpoint failure is non-fatal — continue
    }

    // Create pending records
    let payment;
    let subscription;

    try {
      // Create pending payment record first so we have an ID for the reference
      payment = await db.payment.create({
        data: {
          userId,
          amount,
          currency: "UGX",
          paymentMethod: "MOBILE_MONEY",
          status: "PENDING",
          phoneNumber: msisdn,
        },
      });

      // Create pending subscription
      subscription = await db.subscription.create({
        data: {
          userId,
          plan: getPlanEnum(planId),
          status: "PENDING",
          amount,
          currency: "UGX",
          endDate: calculateEndDate(planId),
        },
      });

      // Link them together
      await db.payment.update({
        where: { id: payment.id },
        data: { subscriptionId: subscription.id },
      });
    } catch (dbError: any) {
      console.error("Database connection error during payment creation:", dbError);
      return res.status(503).json({
        data: null,
        error: "Database is currently unreachable. Please try again in a few seconds (it might be waking up).",
      });
    }

    // Send STK push via Relworx (payment.id is the unique reference)
    const relworxRes = await requestPayment({
      reference: payment.id,
      msisdn,
      amount: Number(amount),
      description: `FlickerPlay ${planId} subscription`,
    });

    if (!relworxRes.success) {
      // Mark payment as failed
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", failureReason: relworxRes.message },
      });
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "FAILED" },
      });
      return res.status(502).json({ data: null, error: relworxRes.message });
    }

    // Store Relworx internal_reference as our transaction ID
    await db.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: relworxRes.internal_reference,
        status: "PROCESSING",
        ...(customerName ? { gatewayResponse: { customer_name: customerName } } : {}),
      },
    });

    return res.status(200).json({
      data: {
        paymentId: payment.id,
        transactionId: relworxRes.internal_reference,
        message: "Payment request sent. Please approve the prompt on your phone.",
      },
      error: null,
    });
  } catch (error: any) {
    console.error("Mobile money payment error:", error?.response?.data ?? error);
    const message =
      error?.response?.data?.message ??
      error?.message ??
      "Failed to process mobile money payment";
    return res.status(500).json({ data: null, error: message });
  }
}

/* ────────────────────────────────────────────────────────────
   POST /payments/validate-phone
   Validates a UG phone number against Relworx.
──────────────────────────────────────────────────────────── */
export async function validateMobileMoneyPhone(req: Request, res: Response) {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ data: null, error: "phoneNumber is required" });
  }
  try {
    const result = await validatePhone(phoneNumber);
    return res.status(200).json({
      data: { valid: result.success, customerName: result.customer_name },
      error: null,
    });
  } catch (error: any) {
    return res.status(500).json({ data: null, error: "Phone validation failed" });
  }
}

/* ────────────────────────────────────────────────────────────
   POST /payments/card   (unchanged — card stays mock until
   a card gateway is wired)
──────────────────────────────────────────────────────────── */
export async function processCardPayment(req: Request, res: Response) {
  const { userId, planId, amount, cardNumber, cardName, expiryDate, cvv } = req.body;

  if (!userId || !planId || !amount || !cardNumber || !cardName || !expiryDate || !cvv) {
    return res.status(400).json({ data: null, error: "Missing required fields" });
  }

  try {
    const cardLast4 = String(cardNumber).slice(-4);

    const payment = await db.payment.create({
      data: { userId, amount, currency: "UGX", paymentMethod: "BANK_CARD", status: "PENDING", cardLast4 },
    });

    const subscription = await db.subscription.create({
      data: { userId, plan: getPlanEnum(planId), status: "PENDING", amount, currency: "UGX", endDate: calculateEndDate(planId) },
    });

    await db.payment.update({ where: { id: payment.id }, data: { subscriptionId: subscription.id } });

    const mockTxId = `CARD${Date.now()}${Math.random().toString(36).substring(2, 9)}`;

    await db.payment.update({
      where: { id: payment.id },
      data: { transactionId: mockTxId, status: "COMPLETED", paidAt: new Date() },
    });

    await db.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE", startDate: new Date() } });
    await db.user.update({ where: { id: userId }, data: { currentPlan: getPlanEnum(planId), planExpiresAt: calculateEndDate(planId) } });

    return res.status(200).json({ data: { paymentId: payment.id, transactionId: mockTxId, message: "Payment successful!" }, error: null });
  } catch (error) {
    console.error("Card payment error:", error);
    return res.status(500).json({ data: null, error: "Failed to process card payment" });
  }
}

/* ────────────────────────────────────────────────────────────
   POST /payments/paypal
──────────────────────────────────────────────────────────── */
export async function processPayPalPayment(req: Request, res: Response) {
  const { userId, planId, amount, email, returnUrl } = req.body;

  if (!userId || !planId || !amount || !email) {
    return res.status(400).json({ data: null, error: "Missing required fields" });
  }

  try {
    const payment = await db.payment.create({
      data: { userId, amount, currency: "UGX", paymentMethod: "PAYPAL", status: "PENDING" },
    });

    const subscription = await db.subscription.create({
      data: { userId, plan: getPlanEnum(planId), status: "PENDING", amount, currency: "UGX", endDate: calculateEndDate(planId) },
    });

    await db.payment.update({ where: { id: payment.id }, data: { subscriptionId: subscription.id } });

    const approvalUrl = returnUrl
      ? `${returnUrl}?paymentId=${payment.id}&status=success`
      : `/payment/success?paymentId=${payment.id}`;

    return res.status(200).json({ data: { paymentId: payment.id, approvalUrl }, error: null });
  } catch (error) {
    console.error("PayPal payment error:", error);
    return res.status(500).json({ data: null, error: "Failed to initialize PayPal payment" });
  }
}

/* ────────────────────────────────────────────────────────────
   GET /payments/:paymentId/status
   Returns DB status; if still PROCESSING, checks Relworx
   for latest status and syncs our DB.
──────────────────────────────────────────────────────────── */
export async function getPaymentStatus(req: Request, res: Response) {
  const { paymentId } = req.params;

  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true, user: { select: { id: true, name: true, email: true } } },
    });

    if (!payment) {
      return res.status(404).json({ data: null, error: "Payment not found" });
    }

    // If mobile money and still in-flight, poll Relworx for updates
    if (
      payment.paymentMethod === "MOBILE_MONEY" &&
      (payment.status === "PENDING" || payment.status === "PROCESSING")
    ) {
      try {
        const tx = await getTransactionByReference(payment.id);

        if (tx) {
          if (tx.status === "success" && payment.subscriptionId) {
            await activateSubscription(
              payment.id,
              payment.subscriptionId,
              payment.userId,
              null
            );
            // Re-fetch updated payment
            const updated = await db.payment.findUnique({ where: { id: paymentId } });
            return res.status(200).json({ data: updated, error: null });
          }

          if (tx.status === "failed") {
            await db.payment.update({
              where: { id: paymentId },
              data: { status: "FAILED", failureReason: "Transaction declined by mobile money provider" },
            });
            if (payment.subscriptionId) {
              await db.subscription.update({ where: { id: payment.subscriptionId }, data: { status: "FAILED" } });
            }
            const updated = await db.payment.findUnique({ where: { id: paymentId } });
            return res.status(200).json({ data: updated, error: null });
          }
        }
      } catch {
        // Relworx poll failure is non-fatal — return DB state
      }
    }

    return res.status(200).json({ data: payment, error: null });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch payment status" });
  }
}

/* ────────────────────────────────────────────────────────────
   POST /payments/relworx/webhook
   Called by Relworx when a payment completes or fails.
──────────────────────────────────────────────────────────── */
export async function relworxWebhook(req: Request, res: Response) {
  try {
    // Verify webhook authenticity using our webhook key
    const webhookKey = process.env.RELWORX_WEBHOOK_KEY;
    const headerKey =
      req.headers["x-relworx-webhook-key"] ||
      req.headers["x-webhook-key"] ||
      req.query.webhook_key;

    if (webhookKey && headerKey !== webhookKey) {
      return res.status(401).json({ error: "Unauthorized webhook" });
    }

    const {
      customer_reference,   // our payment.id
      internal_reference,
      request_status,
      status,
      provider_transaction_id,
      amount,
      msisdn,
    } = req.body;

    const paymentId: string = customer_reference;
    if (!paymentId) {
      return res.status(400).json({ error: "Missing customer_reference" });
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });

    if (!payment) {
      // Acknowledge anyway so Relworx stops retrying
      return res.status(200).json({ received: true });
    }

    // Idempotency — don't process if already completed/failed
    if (payment.status === "COMPLETED" || payment.status === "FAILED") {
      return res.status(200).json({ received: true });
    }

    const isSuccess = request_status === "success" || status === "success";

    if (isSuccess && payment.subscriptionId) {
      await activateSubscription(
        payment.id,
        payment.subscriptionId,
        payment.userId,
        null,
        provider_transaction_id
      );
    } else {
      await db.payment.update({
        where: { id: paymentId },
        data: {
          status: "FAILED",
          failureReason: `Payment ${request_status ?? status ?? "failed"} from provider`,
        },
      });
      if (payment.subscriptionId) {
        await db.subscription.update({ where: { id: payment.subscriptionId }, data: { status: "FAILED" } });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Relworx webhook error:", error);
    // Always return 200 to prevent Relworx from retrying on our server errors
    return res.status(200).json({ received: true });
  }
}

/* ────────────────────────────────────────────────────────────
   POST /payments/:paymentId/verify
   Manual verification fallback (also polls Relworx).
──────────────────────────────────────────────────────────── */
export async function verifyPayment(req: Request, res: Response) {
  const { paymentId } = req.params;

  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });

    if (!payment) {
      return res.status(404).json({ data: null, error: "Payment not found" });
    }

    if (payment.status === "COMPLETED") {
      return res.status(200).json({ data: { verified: true, status: "COMPLETED" }, error: null });
    }

    if (payment.paymentMethod === "MOBILE_MONEY") {
      const tx = await getTransactionByReference(payment.id);

      if (tx?.status === "success" && payment.subscriptionId) {
        await activateSubscription(payment.id, payment.subscriptionId, payment.userId, null);
        return res.status(200).json({ data: { verified: true, status: "COMPLETED" }, error: null });
      }

      if (tx?.status === "failed") {
        await db.payment.update({ where: { id: paymentId }, data: { status: "FAILED", failureReason: "Declined by provider" } });
        return res.status(200).json({ data: { verified: false, status: "FAILED" }, error: null });
      }

      return res.status(200).json({ data: { verified: false, status: payment.status }, error: null });
    }

    // Non-mobile-money: mark completed (card gateway would verify here)
    if (payment.subscriptionId) {
      await activateSubscription(payment.id, payment.subscriptionId, payment.userId, null);
    }

    return res.status(200).json({ data: { verified: true, status: "COMPLETED" }, error: null });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ data: null, error: "Failed to verify payment" });
  }
}

/* ────────────────────────────────────────────────────────────
   GET /subscriptions/user/:userId
   Returns active subscriptions for a given user.
──────────────────────────────────────────────────────────── */
export async function getUserSubscriptions(req: Request, res: Response) {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ data: null, error: "userId is required" });
  }

  try {
    const subscriptions = await db.subscription.findMany({
      where: { userId },
      include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ data: subscriptions, error: null });
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch subscriptions" });
  }
}

/* ────────────────────────────────────────────────────────────
   POST /subscriptions/:subscriptionId/cancel
   Cancels an active subscription.
──────────────────────────────────────────────────────────── */
export async function cancelSubscription(req: Request, res: Response) {
  const { subscriptionId } = req.params;

  if (!subscriptionId) {
    return res.status(400).json({ data: null, error: "subscriptionId is required" });
  }

  try {
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return res.status(404).json({ data: null, error: "Subscription not found" });
    }

    if (subscription.status !== "ACTIVE") {
      return res.status(400).json({ data: null, error: "Only active subscriptions can be cancelled" });
    }

    const updated = await db.subscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    return res.status(200).json({ data: updated, message: "Subscription cancelled successfully", error: null });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return res.status(500).json({ data: null, error: "Failed to cancel subscription" });
  }
}
