type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

type InitializedTransaction = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type VerifiedTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
};

const PAYSTACK_API_URL = "https://api.paystack.co";

export const toSubunit = (amount: number): number => Math.round(amount * 100);

async function paystackRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  const response = await fetch(`${PAYSTACK_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const result = (await response.json()) as PaystackResponse<T>;

  if (!response.ok || !result.status) {
    throw new Error(result.message || "Paystack request failed");
  }

  return result.data;
}

export function initializePaystackTransaction(input: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
  currency: string;
}) {
  return paystackRequest<InitializedTransaction>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      reference: input.reference,
      callback_url: input.callbackUrl,
      currency: input.currency,
    }),
  });
}

export function verifyPaystackTransaction(reference: string) {
  return paystackRequest<VerifiedTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
}
