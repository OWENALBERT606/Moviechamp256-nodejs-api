import express from "express";
import {
  processMobileMoneyPayment,
  processCardPayment,
  processPayPalPayment,
  getPaymentStatus,
  verifyPayment,
} from "@/controllers/payments";

const paymentRouter = express.Router();

// Process payments
paymentRouter.post("/payments/mobile-money", processMobileMoneyPayment);
paymentRouter.post("/payments/card", processCardPayment);
paymentRouter.post("/payments/paypal", processPayPalPayment);

// Payment status and verification
paymentRouter.get("/payments/:paymentId/status", getPaymentStatus);
paymentRouter.post("/payments/:paymentId/verify", verifyPayment);

export default paymentRouter;