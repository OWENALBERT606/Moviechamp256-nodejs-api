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
export function normalizeMsisdn(raw: string): string {
  // Strip everything except digits
  let digits = raw.replace(/\D/g, "");

  // Strip international dialing prefix (00)
  if (digits.startsWith("00")) digits = digits.slice(2);

  // Already has Uganda country code → extract the 9-digit local part
  if (digits.startsWith("256")) {
    const local = digits.slice(3);
    if (local.length === 9) return `256${local}`;
    // Malformed but try anyway
    return `256${local}`;
  }

  // Local format with leading zero (e.g. 0701234567)
  if (digits.startsWith("0") && digits.length >= 10) {
    return `256${digits.slice(1)}`;
  }

  // Bare 9-digit local number (e.g. 701234567)
  if (digits.length === 9) return `256${digits}`;

  // Fallback — return as-is
  return digits;
}

/* ── Request payment (collect from customer) ── */
export interface RequestPaymentParams {
  reference: string;   // our internal payment ID
  msisdn: string;      // customer phone
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
    const { data } = await client.post("/mobile-money/request-payment", {
      account_no: accountNo,
      reference: params.reference,
      msisdn: normalizeMsisdn(params.msisdn),
      currency: "UGX",
      amount: params.amount,
      description: params.description || "FlickerPlay subscription payment",
    });
    return data;
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error.message;
    console.error("Relworx Payment Request Error:", {
      status: error?.response?.status,
      message: errorMsg,
      data: error?.response?.data,
    });
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

export async function validatePhone(
  msisdn: string
): Promise<ValidatePhoneResponse> {
  const accountNo = process.env.RELWORX_ACCOUNT_NO;
  try {
    const { data } = await client.post("/mobile-money/validate", {
      account_no: accountNo,
      msisdn: normalizeMsisdn(msisdn),
    });
    return data;
  } catch (error: any) {
    console.error("Relworx Validation Error:", error?.response?.data || error.message);
    // Re-throw if it's an API error (not a 200 with success:false)
    // This allows the controller to return a 500 status code
    throw error;
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
