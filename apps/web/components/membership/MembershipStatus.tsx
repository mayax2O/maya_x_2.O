"use client";

import { useEffect, useRef, useState } from "react";

import { formatPrice } from "../../lib/format";
import { getMySubscription } from "../../lib/data/memberships";
import { useAuth } from "../../lib/auth/AuthContext";
import type { Subscription } from "../../lib/types";

const STATUS_LABEL: Record<Subscription["status"], string> = {
  pending_payment: "Confirming payment…",
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
};

/** Poll interval while a subscription is still pending_payment right after checkout — the webhook that activates it lands asynchronously, not on the client redirect. */
const POLL_MS = 3000;
const MAX_POLLS = 5;

export function MembershipStatus() {
  const { accessToken } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const pollCount = useRef(0);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    function load() {
      getMySubscription(accessToken!)
        .then((result) => {
          if (cancelled) return;
          setSubscription(result);
          setStatus("ready");
          if (
            result?.status === "pending_payment" &&
            pollCount.current < MAX_POLLS
          ) {
            pollCount.current += 1;
            timer = setTimeout(load, POLL_MS);
          }
        })
        .catch(() => {
          if (!cancelled) setStatus("error");
        });
    }
    load();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [accessToken]);

  if (status === "loading") {
    return <p className="text-[14px] text-slate">Loading membership…</p>;
  }

  if (status === "error") {
    return (
      <p className="text-[14px] text-danger">
        We couldn&apos;t load your membership status.
      </p>
    );
  }

  if (!subscription) {
    return (
      <p className="text-[14px] text-slate">
        You don&apos;t have a membership plan yet.{" "}
        <a
          href="/membership"
          className="font-medium text-brass-deep hover:underline"
        >
          View plans
        </a>
        .
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-slate/20 p-4 text-[14px]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-ink">{subscription.plan.name}</p>
        <span className="text-slate">{STATUS_LABEL[subscription.status]}</span>
      </div>
      <p className="mt-1 text-slate">
        {formatPrice(subscription.priceAtPurchase, subscription.plan.currency)}
      </p>
      {subscription.expiresAt ? (
        <p className="mt-1 text-slate/80">
          Renews/expires{" "}
          {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
            new Date(subscription.expiresAt),
          )}
        </p>
      ) : null}
    </div>
  );
}
