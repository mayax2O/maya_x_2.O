"use client";

import { Button } from "@maya-x/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "../../lib/api/client";
import {
  createPaymentOrder,
  subscribeToPlan,
} from "../../lib/data/memberships";
import { useAuth } from "../../lib/auth/AuthContext";
import { openRazorpayCheckout } from "../../lib/razorpay/checkout";
import type { MembershipPlan } from "../../lib/types";

export function SubscribeButton({
  plan,
  variant,
}: {
  plan: MembershipPlan;
  variant: "primary" | "secondary";
}) {
  const router = useRouter();
  const { status: authStatus, accessToken, user } = useAuth();
  const [state, setState] = useState<"idle" | "processing">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    if (authStatus !== "authenticated" || !accessToken) {
      router.push("/login");
      return;
    }

    setError(null);
    setState("processing");
    try {
      const { subscriptionId } = await subscribeToPlan(plan.id, accessToken);
      const order = await createPaymentOrder(subscriptionId, accessToken);

      await openRazorpayCheckout({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "MAYA_X Membership",
        description: `${plan.name} plan`,
        prefill: { name: user?.fullName, email: user?.email },
        theme: { color: "#8f6934" },
        handler: () => {
          // Entitlement activates only once Razorpay's webhook confirms
          // the capture server-side (Enterprise Architecture §8) — this
          // client-side callback firing is not proof of payment, just the
          // signal to send the customer somewhere that reflects the real
          // status once it lands.
          router.push("/account?subscribed=1");
        },
        modal: {
          ondismiss: () => setState("idle"),
        },
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong starting checkout. Please try again.",
      );
      setState("idle");
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-2">
      <Button
        type="button"
        variant={variant}
        className="justify-center"
        disabled={state === "processing"}
        onClick={handleSubscribe}
      >
        {state === "processing" ? "Starting checkout…" : "Subscribe"}
      </Button>
      {error ? (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
