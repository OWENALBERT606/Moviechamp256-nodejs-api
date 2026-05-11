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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMsisdn = normalizeMsisdn;
exports.requestPayment = requestPayment;
exports.validatePhone = validatePhone;
exports.checkWalletBalance = checkWalletBalance;
exports.getTransactions = getTransactions;
exports.getTransactionByReference = getTransactionByReference;
const axios_1 = __importDefault(require("axios"));
const BASE_URL = process.env.RELWORX_BASE_URL || "https://payments.relworx.com/api";
const API_KEY = process.env.RELWORX_API_KEY;
const ACCOUNT_NO = process.env.RELWORX_ACCOUNT_NO;
const client = axios_1.default.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.relworx.v2",
        Authorization: `Bearer ${API_KEY}`,
    },
    timeout: 30000,
});
function normalizeMsisdn(raw) {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("00"))
        digits = digits.slice(2);
    if (digits.startsWith("256")) {
        const local = digits.slice(3);
        if (local.length === 9)
            return `+256${local}`;
        return `+256${local}`;
    }
    if (digits.startsWith("0") && digits.length >= 10) {
        return `+256${digits.slice(1)}`;
    }
    if (digits.length === 9)
        return `+256${digits}`;
    return `+${digits}`;
}
function requestPayment(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data } = yield client.post("/mobile-money/request-payment", {
            account_no: ACCOUNT_NO,
            reference: params.reference,
            msisdn: normalizeMsisdn(params.msisdn),
            currency: "UGX",
            amount: params.amount,
            description: params.description || "FlickerPlay subscription payment",
        });
        return data;
    });
}
function validatePhone(msisdn) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data } = yield client.post("/mobile-money/validate", {
            msisdn: normalizeMsisdn(msisdn),
        });
        return data;
    });
}
function checkWalletBalance() {
    return __awaiter(this, void 0, void 0, function* () {
        const { data } = yield client.get("/mobile-money/check-wallet-balance", {
            params: { account_no: ACCOUNT_NO, currency: "UGX" },
        });
        return data;
    });
}
function getTransactions() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { data } = yield client.get("/payment-requests/transactions", {
            params: { account_no: ACCOUNT_NO },
        });
        return (_a = data === null || data === void 0 ? void 0 : data.transactions) !== null && _a !== void 0 ? _a : [];
    });
}
function getTransactionByReference(reference) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const transactions = yield getTransactions();
        return (_a = transactions.find((t) => t.customer_reference === reference)) !== null && _a !== void 0 ? _a : null;
    });
}
