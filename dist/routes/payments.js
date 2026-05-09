"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payments_1 = require("../controllers/payments");
const paymentRouter = express_1.default.Router();
paymentRouter.post("/payments/mobile-money", payments_1.processMobileMoneyPayment);
paymentRouter.post("/payments/card", payments_1.processCardPayment);
paymentRouter.post("/payments/paypal", payments_1.processPayPalPayment);
paymentRouter.get("/payments/:paymentId/status", payments_1.getPaymentStatus);
paymentRouter.post("/payments/:paymentId/verify", payments_1.verifyPayment);
exports.default = paymentRouter;
