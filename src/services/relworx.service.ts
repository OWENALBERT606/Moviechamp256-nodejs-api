import axios from "axios";

const BASE_URL = process.env.RELWORX_BASE_URL || "https://payments.relworx.com/api";

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/vnd.relworx.v2",
  },
  timeout: 30000,
});

// Use interceptor to always use latest API key from env
client.interceptors.request.use((config) => {
  const apiKey = process.env.RELWORX_API_KEY;
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});

/* Normalise any UG phone number format to 256XXXXXXXXX (Relworx preferred format)
   Handles: +256XXXXXXXXX, 256XXXXXXXXX, 0XXXXXXXXX, XXXXXXXXX, 00256XXXXXXXXX */
/* Normalise any UG phone number to Relworx international format: +256XXXXXXXXX */
export function normalizeMsisdn(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);

  // Already has country code 256XXXXXXXXX
  if (digits.startsWith("256")) {
    const local = digits.slice(3);
    if (local.length === 9 && !local.startsWith("0")) return `+256${local}`;
    // 256 + 0XXXXXXXXX (extra leading zero) — strip it
    if (local.startsWith("0") && local.length === 10) return `+256${local.slice(1)}`;
    return `+256${local}`;
  }

  // Local format 0XXXXXXXXX (exactly 10 digits)
  if (digits.startsWith("0") && digits.length === 10) return `+256${digits.slice(1)}`;

  // Bare 9-digit local number XXXXXXXXX (must not start with 0)
  if (digits.length === 9 && !digits.startsWith("0")) return `+256${digits}`;

  return digits;
}

/* ── Request payment (collect from customer) ── */
export interface RequestPaymentParams {
  reference: string;
  msisdn: string;
  amount: number;
  description?: string;
}

export interface RelworxPaymentResponse {
  success: boolean;
  message: string;
  internal_reference: string;
}

export async function requestPayment(
  params: RequestPaymentParams
): Promise<RelworxPaymentResponse> {
  const accountNo = process.env.RELWORX_ACCOUNT_NO;
  try {
    const payload: Record<string, any> = {
      account_no: accountNo,
      reference: params.reference,
      msisdn: normalizeMsisdn(params.msisdn),
      currency: "UGX",
      amount: params.amount,
      description: params.description || "FlickerPlay subscription payment",
    };
    console.log("[Relworx request-payment] →", JSON.stringify(payload));
    const { data } = await client.post("/mobile-money/request-payment", payload);
    console.log("[Relworx request-payment] ←", JSON.stringify(data));
    return data;
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error.message;
    console.error("[Relworx request-payment] ← error", error?.response?.status, JSON.stringify(error?.response?.data));
    return {
      success: false,
      message: errorMsg,
      internal_reference: "",
    };
  }
}

/* ── Validate phone number ── */
export interface ValidatePhoneResponse {
  success: boolean;
  message: string;
  customer_name?: string;
}

export async function validatePhone(msisdn: string): Promise<ValidatePhoneResponse> {
  const normalized = normalizeMsisdn(msisdn);
  console.log("[Relworx validate] →", JSON.stringify({ msisdn: normalized }));
  try {
    const { data } = await client.post("/mobile-money/validate", { msisdn: normalized });
    console.log("[Relworx validate] ←", JSON.stringify(data));
    return data;
  } catch (error: any) {
    const body = error?.response?.data;
    console.error("[Relworx validate] ← error", error?.response?.status, JSON.stringify(body));
    return {
      success: false,
      message: body?.message || error.message || "Validation failed",
    };
  }
}

/* ── Check wallet balance ── */
export async function checkWalletBalance(): Promise<{
  success: boolean;
  balance?: number;
  currency?: string;
}> {
  const accountNo = process.env.RELWORX_ACCOUNT_NO;
  try {
    const { data } = await client.get("/mobile-money/check-wallet-balance", {
      params: { account_no: accountNo, currency: "UGX" },
    });
    return data;
  } catch (error: any) {
    console.error("Relworx Balance Error:", error?.response?.data || error.message);
    return { success: false };
  }
}

/* ── Get transactions list (used to poll status) ── */
export interface RelworxTransaction {
  customer_reference: string;
  provider: string;
  msisdn: string;
  transaction_type: string;
  currency: string;
  amount: number;
  status: "pending" | "success" | "failed";
  created_at: string;
}

export async function getTransactions(): Promise<RelworxTransaction[]> {
  const accountNo = process.env.RELWORX_ACCOUNT_NO;
  try {
    const { data } = await client.get("/payment-requests/transactions", {
      params: { account_no: accountNo },
    });
    return data?.transactions ?? [];
  } catch (error: any) {
    console.error("Relworx Transactions Error:", error?.response?.data || error.message);
    return [];
  }
}

/* ── Look up a single transaction by our reference ── */
export async function getTransactionByReference(
  reference: string
): Promise<RelworxTransaction | null> {
  const transactions = await getTransactions();
  return transactions.find((t) => t.customer_reference === reference) ?? null;
}
