export type PaymentStatus =
  "created" | "authorized" | "captured" | "failed" | "refunded";

export interface Payment {
  id: string;
  subscriptionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
}

export interface PaymentListFilters {
  status?: PaymentStatus;
  userId?: string;
}
