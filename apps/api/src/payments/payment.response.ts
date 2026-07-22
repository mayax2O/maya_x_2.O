import type { Payment, PaymentStatus, User } from "@prisma/client";

export interface PaymentResponse {
  id: string;
  subscriptionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
}

export function toPaymentResponse(payment: Payment): PaymentResponse {
  return {
    id: payment.id,
    subscriptionId: payment.subscriptionId,
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    createdAt: payment.createdAt,
  };
}

export type PaymentWithUser = Payment & {
  user: Pick<User, "id" | "fullName" | "email">;
};

export interface AdminPaymentResponse extends PaymentResponse {
  user: { id: string; fullName: string; email: string };
}

export function toAdminPaymentResponse(
  payment: PaymentWithUser,
): AdminPaymentResponse {
  return {
    ...toPaymentResponse(payment),
    user: {
      id: payment.user.id,
      fullName: payment.user.fullName,
      email: payment.user.email,
    },
  };
}
