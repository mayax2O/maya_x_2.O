/**
 * Thin wrapper over Razorpay's hosted Checkout.js — the client-side SDK
 * that owns the entire card/UPI/netbanking entry surface so this app never
 * receives or stores payment-instrument data (Enterprise Architecture §8,
 * PCI-DSS scope minimization). `key_id` is Razorpay's public identifier
 * (safe to ship to the browser — distinct from the server-only
 * `key_secret`, which this app never sends to the client).
 */

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  handler: (response: { razorpay_payment_id: string }) => void;
  modal?: { ondismiss?: () => void };
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
}

interface RazorpayCheckoutInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayCheckoutOptions,
    ) => RazorpayCheckoutInstance;
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Razorpay checkout can only be opened in the browser."),
    );
  }
  if (window.Razorpay) return Promise.resolve();

  scriptLoadPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load the Razorpay checkout script."));
    document.body.appendChild(script);
  });
  return scriptLoadPromise;
}

export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions,
): Promise<void> {
  await loadCheckoutScript();
  if (!window.Razorpay) {
    throw new Error("Razorpay checkout script did not initialize.");
  }
  new window.Razorpay(options).open();
}
