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
exports.validateMobileMoneyPhone = validateMobileMoneyPhone;
exports.processCardPayment = processCardPayment;
exports.processPayPalPayment = processPayPalPayment;
exports.getPaymentStatus = getPaymentStatus;
exports.relworxWebhook = relworxWebhook;
exports.verifyPayment = verifyPayment;
exports.getUserSubscriptions = getUserSubscriptions;
exports.cancelSubscription = cancelSubscription;
const db_1 = require("../db/db");
const cache_1 = require("../utils/cache");
const relworx_service_1 = require("../services/relworx.service");
function calculateEndDate(planId) {
    var _a;
    const durations = {
        daily: 1,
        weekly: 7,
        two_weeks: 14,
        monthly: 30,
        quarterly: 90,
        semiannual: 180,
        annual: 365,
    };
    const end = new Date();
    end.setDate(end.getDate() + ((_a = durations[planId]) !== null && _a !== void 0 ? _a : 30));
    return end;
}
function getPlanEnum(planId) {
    var _a;
    const mapping = {
        daily: "DAILY",
        weekly: "WEEKLY",
        two_weeks: "TWO_WEEKS",
        monthly: "MONTHLY",
        quarterly: "QUARTERLY",
        semiannual: "SEMI_ANNUAL",
        annual: "ANNUAL",
    };
    return (_a = mapping[planId]) !== null && _a !== void 0 ? _a : "MONTHLY";
}
function activateSubscription(paymentId, subscriptionId, userId, planId, providerTxId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db_1.db.payment.update({
            where: { id: paymentId },
            data: Object.assign({ status: "COMPLETED", paidAt: new Date() }, (providerTxId ? { gatewayResponse: { provider_transaction_id: providerTxId } } : {})),
        });
        const subscription = yield db_1.db.subscription.update({
            where: { id: subscriptionId },
            data: { status: "ACTIVE", startDate: new Date() },
        });
        yield db_1.db.user.update({
            where: { id: userId },
            data: {
                currentPlan: subscription.plan,
                planExpiresAt: subscription.endDate,
            },
        });
        yield (0, cache_1.invalidatePattern)(`access:${userId}:*`);
        yield (0, cache_1.invalidatePattern)(`stream-url:${userId}:*`);
    });
}
function processMobileMoneyPayment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const { userId, planId, amount, phoneNumber, provider } = req.body;
        if (!userId || !planId || !amount || !phoneNumber) {
            return res.status(400).json({ data: null, error: "Missing required fields" });
        }
        try {
            const msisdn = (0, relworx_service_1.normalizeMsisdn)(phoneNumber);
            let customerName;
            try {
                const validation = yield (0, relworx_service_1.validatePhone)(msisdn);
                if (!validation.success) {
                    return res.status(400).json({
                        data: null,
                        error: "Phone number is not valid for mobile money. Please check and try again.",
                    });
                }
                customerName = validation.customer_name;
            }
            catch (_g) {
            }
            let payment;
            let subscription;
            try {
                payment = yield db_1.db.payment.create({
                    data: {
                        userId,
                        amount,
                        currency: "UGX",
                        paymentMethod: "MOBILE_MONEY",
                        status: "PENDING",
                        phoneNumber: msisdn,
                    },
                });
                subscription = yield db_1.db.subscription.create({
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
            }
            catch (dbError) {
                console.error("Database connection error during payment creation:", dbError);
                return res.status(503).json({
                    data: null,
                    error: "Database is currently unreachable. Please try again in a few seconds (it might be waking up).",
                });
            }
            const relworxRes = yield (0, relworx_service_1.requestPayment)({
                reference: payment.id,
                msisdn,
                amount: Number(amount),
                description: `FlickerPlay ${planId} subscription`,
            });
            if (!relworxRes.success) {
                yield db_1.db.payment.update({
                    where: { id: payment.id },
                    data: { status: "FAILED", failureReason: relworxRes.message },
                });
                yield db_1.db.subscription.update({
                    where: { id: subscription.id },
                    data: { status: "FAILED" },
                });
                return res.status(502).json({ data: null, error: relworxRes.message });
            }
            yield db_1.db.payment.update({
                where: { id: payment.id },
                data: Object.assign({ transactionId: relworxRes.internal_reference, status: "PROCESSING" }, (customerName ? { gatewayResponse: { customer_name: customerName } } : {})),
            });
            return res.status(200).json({
                data: {
                    paymentId: payment.id,
                    transactionId: relworxRes.internal_reference,
                    message: "Payment request sent. Please approve the prompt on your phone.",
                },
                error: null,
            });
        }
        catch (error) {
            console.error("Mobile money payment error:", (_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : error);
            const message = (_f = (_e = (_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) !== null && _e !== void 0 ? _e : error === null || error === void 0 ? void 0 : error.message) !== null && _f !== void 0 ? _f : "Failed to process mobile money payment";
            return res.status(500).json({ data: null, error: message });
        }
    });
}
function validateMobileMoneyPhone(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ data: null, error: "phoneNumber is required" });
        }
        try {
            const result = yield (0, relworx_service_1.validatePhone)(phoneNumber);
            return res.status(200).json({
                data: { valid: result.success, customerName: result.customer_name },
                error: null,
            });
        }
        catch (error) {
            return res.status(500).json({ data: null, error: "Phone validation failed" });
        }
    });
}
function processCardPayment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, planId, amount, cardNumber, cardName, expiryDate, cvv } = req.body;
        if (!userId || !planId || !amount || !cardNumber || !cardName || !expiryDate || !cvv) {
            return res.status(400).json({ data: null, error: "Missing required fields" });
        }
        try {
            const cardLast4 = String(cardNumber).slice(-4);
            const payment = yield db_1.db.payment.create({
                data: { userId, amount, currency: "UGX", paymentMethod: "BANK_CARD", status: "PENDING", cardLast4 },
            });
            const subscription = yield db_1.db.subscription.create({
                data: { userId, plan: getPlanEnum(planId), status: "PENDING", amount, currency: "UGX", endDate: calculateEndDate(planId) },
            });
            yield db_1.db.payment.update({ where: { id: payment.id }, data: { subscriptionId: subscription.id } });
            const mockTxId = `CARD${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
            yield db_1.db.payment.update({
                where: { id: payment.id },
                data: { transactionId: mockTxId, status: "COMPLETED", paidAt: new Date() },
            });
            yield db_1.db.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE", startDate: new Date() } });
            yield db_1.db.user.update({ where: { id: userId }, data: { currentPlan: getPlanEnum(planId), planExpiresAt: calculateEndDate(planId) } });
            return res.status(200).json({ data: { paymentId: payment.id, transactionId: mockTxId, message: "Payment successful!" }, error: null });
        }
        catch (error) {
            console.error("Card payment error:", error);
            return res.status(500).json({ data: null, error: "Failed to process card payment" });
        }
    });
}
function processPayPalPayment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, planId, amount, email, returnUrl } = req.body;
        if (!userId || !planId || !amount || !email) {
            return res.status(400).json({ data: null, error: "Missing required fields" });
        }
        try {
            const payment = yield db_1.db.payment.create({
                data: { userId, amount, currency: "UGX", paymentMethod: "PAYPAL", status: "PENDING" },
            });
            const subscription = yield db_1.db.subscription.create({
                data: { userId, plan: getPlanEnum(planId), status: "PENDING", amount, currency: "UGX", endDate: calculateEndDate(planId) },
            });
            yield db_1.db.payment.update({ where: { id: payment.id }, data: { subscriptionId: subscription.id } });
            const approvalUrl = returnUrl
                ? `${returnUrl}?paymentId=${payment.id}&status=success`
                : `/payment/success?paymentId=${payment.id}`;
            return res.status(200).json({ data: { paymentId: payment.id, approvalUrl }, error: null });
        }
        catch (error) {
            console.error("PayPal payment error:", error);
            return res.status(500).json({ data: null, error: "Failed to initialize PayPal payment" });
        }
    });
}
function getPaymentStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { paymentId } = req.params;
        try {
            const payment = yield db_1.db.payment.findUnique({
                where: { id: paymentId },
                include: { subscription: true, user: { select: { id: true, name: true, email: true } } },
            });
            if (!payment) {
                return res.status(404).json({ data: null, error: "Payment not found" });
            }
            if (payment.paymentMethod === "MOBILE_MONEY" &&
                (payment.status === "PENDING" || payment.status === "PROCESSING")) {
                try {
                    const tx = yield (0, relworx_service_1.getTransactionByReference)(payment.id);
                    if (tx) {
                        if (tx.status === "success" && payment.subscriptionId) {
                            yield activateSubscription(payment.id, payment.subscriptionId, payment.userId, null);
                            const updated = yield db_1.db.payment.findUnique({ where: { id: paymentId } });
                            return res.status(200).json({ data: updated, error: null });
                        }
                        if (tx.status === "failed") {
                            yield db_1.db.payment.update({
                                where: { id: paymentId },
                                data: { status: "FAILED", failureReason: "Transaction declined by mobile money provider" },
                            });
                            if (payment.subscriptionId) {
                                yield db_1.db.subscription.update({ where: { id: payment.subscriptionId }, data: { status: "FAILED" } });
                            }
                            const updated = yield db_1.db.payment.findUnique({ where: { id: paymentId } });
                            return res.status(200).json({ data: updated, error: null });
                        }
                    }
                }
                catch (_a) {
                }
            }
            return res.status(200).json({ data: payment, error: null });
        }
        catch (error) {
            console.error("Error fetching payment status:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch payment status" });
        }
    });
}
function relworxWebhook(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const webhookKey = process.env.RELWORX_WEBHOOK_KEY;
            const headerKey = req.headers["x-relworx-webhook-key"] ||
                req.headers["x-webhook-key"] ||
                req.query.webhook_key;
            if (webhookKey && headerKey !== webhookKey) {
                return res.status(401).json({ error: "Unauthorized webhook" });
            }
            const { customer_reference, internal_reference, request_status, status, provider_transaction_id, amount, msisdn, } = req.body;
            const paymentId = customer_reference;
            if (!paymentId) {
                return res.status(400).json({ error: "Missing customer_reference" });
            }
            const payment = yield db_1.db.payment.findUnique({
                where: { id: paymentId },
                include: { subscription: true },
            });
            if (!payment) {
                return res.status(200).json({ received: true });
            }
            if (payment.status === "COMPLETED" || payment.status === "FAILED") {
                return res.status(200).json({ received: true });
            }
            const isSuccess = request_status === "success" || status === "success";
            if (isSuccess && payment.subscriptionId) {
                yield activateSubscription(payment.id, payment.subscriptionId, payment.userId, null, provider_transaction_id);
            }
            else {
                yield db_1.db.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: "FAILED",
                        failureReason: `Payment ${(_a = request_status !== null && request_status !== void 0 ? request_status : status) !== null && _a !== void 0 ? _a : "failed"} from provider`,
                    },
                });
                if (payment.subscriptionId) {
                    yield db_1.db.subscription.update({ where: { id: payment.subscriptionId }, data: { status: "FAILED" } });
                }
            }
            return res.status(200).json({ received: true });
        }
        catch (error) {
            console.error("Relworx webhook error:", error);
            return res.status(200).json({ received: true });
        }
    });
}
function verifyPayment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { paymentId } = req.params;
        try {
            const payment = yield db_1.db.payment.findUnique({
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
                const tx = yield (0, relworx_service_1.getTransactionByReference)(payment.id);
                if ((tx === null || tx === void 0 ? void 0 : tx.status) === "success" && payment.subscriptionId) {
                    yield activateSubscription(payment.id, payment.subscriptionId, payment.userId, null);
                    return res.status(200).json({ data: { verified: true, status: "COMPLETED" }, error: null });
                }
                if ((tx === null || tx === void 0 ? void 0 : tx.status) === "failed") {
                    yield db_1.db.payment.update({ where: { id: paymentId }, data: { status: "FAILED", failureReason: "Declined by provider" } });
                    return res.status(200).json({ data: { verified: false, status: "FAILED" }, error: null });
                }
                return res.status(200).json({ data: { verified: false, status: payment.status }, error: null });
            }
            if (payment.subscriptionId) {
                yield activateSubscription(payment.id, payment.subscriptionId, payment.userId, null);
            }
            return res.status(200).json({ data: { verified: true, status: "COMPLETED" }, error: null });
        }
        catch (error) {
            console.error("Payment verification error:", error);
            return res.status(500).json({ data: null, error: "Failed to verify payment" });
        }
    });
}
function getUserSubscriptions(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ data: null, error: "userId is required" });
        }
        try {
            const subscriptions = yield db_1.db.subscription.findMany({
                where: { userId },
                include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
                orderBy: { createdAt: "desc" },
            });
            return res.status(200).json({ data: subscriptions, error: null });
        }
        catch (error) {
            console.error("Error fetching user subscriptions:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch subscriptions" });
        }
    });
}
function cancelSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { subscriptionId } = req.params;
        if (!subscriptionId) {
            return res.status(400).json({ data: null, error: "subscriptionId is required" });
        }
        try {
            const subscription = yield db_1.db.subscription.findUnique({
                where: { id: subscriptionId },
            });
            if (!subscription) {
                return res.status(404).json({ data: null, error: "Subscription not found" });
            }
            if (subscription.status !== "ACTIVE") {
                return res.status(400).json({ data: null, error: "Only active subscriptions can be cancelled" });
            }
            const updated = yield db_1.db.subscription.update({
                where: { id: subscriptionId },
                data: { status: "CANCELLED", cancelledAt: new Date() },
            });
            return res.status(200).json({ data: updated, message: "Subscription cancelled successfully", error: null });
        }
        catch (error) {
            console.error("Error cancelling subscription:", error);
            return res.status(500).json({ data: null, error: "Failed to cancel subscription" });
        }
    });
}
