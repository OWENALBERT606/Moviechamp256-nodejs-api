import express from "express";
import {
  processMobileMoneyPayment,
  validateMobileMoneyPhone,
  processCardPayment,
  processPayPalPayment,
  getPaymentStatus,
  verifyPayment,
  relworxWebhook,
  getUserSubscriptions,
  cancelSubscription,
} from "@/controllers/payments";

const paymentRouter = express.Router();

// Process payments
paymentRouter.post("/payments/mobile-money", processMobileMoneyPayment);
paymentRouter.post("/payments/mobile-money/validate-phone", validateMobileMoneyPhone);
paymentRouter.post("/payments/card", processCardPayment);
paymentRouter.post("/payments/paypal", processPayPalPayment);

// Payment status and verification
paymentRouter.get("/payments/:paymentId/status", getPaymentStatus);
paymentRouter.post("/payments/:paymentId/verify", verifyPayment);

// Relworx webhook — called by Relworx when payment completes or fails
paymentRouter.post("/payments/relworx/webhook", relworxWebhook);

// Subscription routes
paymentRouter.get("/subscriptions/user/:userId", getUserSubscriptions);
paymentRouter.post("/subscriptions/:subscriptionId/cancel", cancelSubscription);

export default paymentRouter;
