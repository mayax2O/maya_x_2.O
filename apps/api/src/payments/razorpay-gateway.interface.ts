/** DI token — inject with `@Inject(RAZORPAY_GATEWAY)`. */
export const RAZORPAY_GATEWAY = Symbol("RAZORPAY_GATEWAY");

export interface CreateOrderParams {
  /** Smallest currency unit (e.g. paise for INR) — Razorpay's own convention. */
  amountInSubunits: number;
  currency: string;
  /** Razorpay's internal reference; must be unique per order. Max 40 chars. */
  receipt: string;
}

export interface CreatedOrder {
  id: string;
  amount: number;
  currency: string;
}

/**
 * Thin seam over the Razorpay SDK so PaymentsService never talks to the
 * `razorpay` package directly. RazorpayGatewayService (real implementation)
 * is bound to this token in production; e2e tests override the binding
 * with a stub so they never make a real network call to Razorpay — unit
 * tests mock this interface the same way BookingService's tests mock
 * PrismaService.
 */
export interface RazorpayGateway {
  createOrder(params: CreateOrderParams): Promise<CreatedOrder>;
  /** `rawBody` must be the exact bytes Razorpay signed — a re-serialized JSON object will not verify. */
  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean;
}
