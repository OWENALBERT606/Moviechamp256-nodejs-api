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
exports.processMobileMoneyPayment = processMobileMoneyPayment;
exports.processCardPayment = processCardPayment;
exports.processPayPalPayment = processPayPalPayment;
exports.getPaymentStatus = getPaymentStatus;
exports.verifyPayment = verifyPayment;
const db_1 = require("../db/db");
const cache_1 = require("../utils/cache");
function calculateEndDate(planId) {
    const now = new Date();
    const durations = {
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
function getPlanEnum(planId) {
    const mapping = {
        daily: "DAILY",
        weekly: "WEEKLY",
        monthly: "MONTHLY",
        quarterly: "QUARTERLY",
        semiannual: "SEMI_ANNUAL",
        annual: "ANNUAL",
    };
    return mapping[planId] || "MONTHLY";
}
function processMobileMoneyPayment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, planId, amount, phoneNumber, provider } = req.body;
        try {
            if (!userId || !planId || !amount || !phoneNumber || !provider) {
                return res.status(400).json({
                    data: null,
                    error: "Missing required fields",
                });
            }
            const payment = yield db_1.db.payment.create({
                data: {
                    userId,
                    amount,
                    currency: "UGX",
                    paymentMethod: "MOBILE_MONEY",
                    status: "PENDING",
                    phoneNumber,
                },
            });
            const subscription = yield db_1.db.subscription.create({
                data: {
                    userId,
                    plan: getPlanEnum(planId),
                    status: "PENDING",
                    amount,
                    currency: "UGX",
                    endDate: calculateEndDate(planId),
                },
            });
            yield db_1.db.payment.update({
                where: { id: payment.id },
                data: { subscriptionId: subscription.id },
            });
            const mockTransactionId = `MM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
            yield db_1.db.payment.update({
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
        }
        catch (error) {
            console.error("Mobile money payment error:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to process mobile money payment",
            });
        }
    });
}
function processCardPayment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, planId, amount, cardNumber, cardName, expiryDate, cvv } = req.body;
        try {
            if (!userId || !planId || !amount || !cardNumber || !cardName || !expiryDate || !cvv) {
                return res.status(400).json({
                    data: null,
                    error: "Missing required fields",
                });
            }
            const cardLast4 = cardNumber.slice(-4);
            const payment = yield db_1.db.payment.create({
                data: {
                    userId,
                    amount,
                    currency: "UGX",
                    paymentMethod: "BANK_CARD",
                    status: "PENDING",
                    cardLast4,
                },
            });
            const subscription = yield db_1.db.subscription.create({
                data: {
                    userId,
                    plan: getPlanEnum(planId),
                    status: "PENDING",
                    amount,
                    currency: "UGX",
                    endDate: calculateEndDate(planId),
                },
            });
            yield db_1.db.payment.update({
                where: { id: payment.id },
                data: { subscriptionId: subscription.id },
            });
            const mockTransactionId = `CARD${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
            yield db_1.db.payment.update({
                where: { id: payment.id },
                data: {
                    transactionId: mockTransactionId,
                    status: "COMPLETED",
                    paidAt: new Date(),
                },
            });
            yield db_1.db.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: "ACTIVE",
                    startDate: new Date(),
                },
            });
            yield db_1.db.user.update({
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
        }
        catch (error) {
            console.error("Card payment error:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to process card payment",
            });
        }
    });
}
function processPayPalPayment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, planId, amount, email, returnUrl, cancelUrl } = req.body;
        try {
            if (!userId || !planId || !amount || !email) {
                return res.status(400).json({
                    data: null,
                    error: "Missing required fields",
                });
            }
            const payment = yield db_1.db.payment.create({
                data: {
                    userId,
                    amount,
                    currency: "UGX",
                    paymentMethod: "PAYPAL",
                    status: "PENDING",
                },
            });
            const subscription = yield db_1.db.subscription.create({
                data: {
                    userId,
                    plan: getPlanEnum(planId),
                    status: "PENDING",
                    amount,
                    currency: "UGX",
                    endDate: calculateEndDate(planId),
                },
            });
            yield db_1.db.payment.update({
                where: { id: payment.id },
                data: { subscriptionId: subscription.id },
            });
            const mockApprovalUrl = `${returnUrl}?paymentId=${payment.id}&status=success`;
            return res.status(200).json({
                data: {
                    paymentId: payment.id,
                    approvalUrl: mockApprovalUrl,
                },
                error: null,
            });
        }
        catch (error) {
            console.error("PayPal payment error:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to initialize PayPal payment",
            });
        }
    });
}
function getPaymentStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { paymentId } = req.params;
        try {
            const payment = yield db_1.db.payment.findUnique({
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
        }
        catch (error) {
            console.error("Error fetching payment status:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to fetch payment status",
            });
        }
    });
}
function verifyPayment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { paymentId } = req.params;
        try {
            const payment = yield db_1.db.payment.findUnique({
                where: { id: paymentId },
                include: { subscription: true },
            });
            if (!payment) {
                return res.status(404).json({
                    data: null,
                    error: "Payment not found",
                });
            }
            if (payment.status === "PENDING" || payment.status === "PROCESSING") {
                yield db_1.db.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: "COMPLETED",
                        paidAt: new Date(),
                    },
                });
                if (payment.subscriptionId) {
                    yield db_1.db.subscription.update({
                        where: { id: payment.subscriptionId },
                        data: {
                            status: "ACTIVE",
                            startDate: new Date(),
                        },
                    });
                    yield db_1.db.user.update({
                        where: { id: payment.userId },
                        data: {
                            currentPlan: (_a = payment.subscription) === null || _a === void 0 ? void 0 : _a.plan,
                            planExpiresAt: (_b = payment.subscription) === null || _b === void 0 ? void 0 : _b.endDate,
                        },
                    });
                    yield (0, cache_1.invalidatePattern)(`access:${payment.userId}:*`);
                    yield (0, cache_1.invalidatePattern)(`stream-url:${payment.userId}:*`);
                }
            }
            return res.status(200).json({
                data: { verified: true, status: "COMPLETED" },
                error: null,
            });
        }
        catch (error) {
            console.error("Payment verification error:", error);
            return res.status(500).json({
                data: null,
                error: "Failed to verify payment",
            });
        }
    });
}
