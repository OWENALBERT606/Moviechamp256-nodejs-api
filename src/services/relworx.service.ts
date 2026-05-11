import axios from "axios";

const BASE_URL = process.env.RELWORX_BASE_URL || "https://payments.relworx.com/api";
const API_KEY = process.env.RELWORX_API_KEY!;
const ACCOUNT_NO = process.env.RELWORX_ACCOUNT_NO!;

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/vnd.relworx.v2",
    Authorization: `Bearer ${API_KEY}`,
  },
  timeout: 30000,
});

/* Normalise any UG phone number format to +256XXXXXXXXX
   Handles: +256XXXXXXXXX, 256XXXXXXXXX, 0XXXXXXXXX, XXXXXXXXX, 00256XXXXXXXXX */
export function normalizeMsisdn(raw: string): string {
  // Strip everything except digits
  let digits = raw.replace(/\D/g, "");

  // Strip international dialing prefix (00)
  if (digits.startsWith("00")) digits = digits.slice(2);

  // Already has Uganda country code → extract the 9-digit local part
  if (digits.startsWith("256")) {
    const local = digits.slice(3);
    if (local.length === 9) return `+256${local}`;
    // Malformed but try anyway
    return `+256${local}`;
  }

  // Local format with leading zero (e.g. 0701234567)
  if (digits.startsWith("0") && digits.length >= 10) {
    return `+256${digits.slice(1)}`;
  }

  // Bare 9-digit local number (e.g. 701234567)
  if (digits.length === 9) return `+256${digits}`;

  // Fallback — return as-is with + prefix
  return `+${digits}`;
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
  const { data } = await client.post("/mobile-money/request-payment", {
    account_no: ACCOUNT_NO,
    reference: params.reference,
    msisdn: normalizeMsisdn(params.msisdn),
    currency: "UGX",
    amount: params.amount,
    description: params.description || "FlickerPlay subscription payment",
  });
  return data;
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
  const { data } = await client.post("/mobile-money/validate", {
    msisdn: normalizeMsisdn(msisdn),
  });
  return data;
}

/* ── Check wallet balance ── */
export async function checkWalletBalance(): Promise<{
  success: boolean;
  balance?: number;
  currency?: string;
}> {
  const { data } = await client.get("/mobile-money/check-wallet-balance", {
    params: { account_no: ACCOUNT_NO, currency: "UGX" },
  });
  return data;
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
  const { data } = await client.get("/payment-requests/transactions", {
    params: { account_no: ACCOUNT_NO },
  });
  return data?.transactions ?? [];
}

/* ── Look up a single transaction by our reference ── */
export async function getTransactionByReference(
  reference: string
): Promise<RelworxTransaction | null> {
  const transactions = await getTransactions();
  return transactions.find((t) => t.customer_reference === reference) ?? null;
}
