import type { QuickBookingFormValues, QuickBookingSubmission } from "../types";

/**
 * Mock submission handler for the booking form(s). Simulates network
 * latency and returns a confirmation shape matching what a real
 * `POST /api/v1/bookings` response will look like, so the form and its
 * calling components don't change when the backend lands (M3).
 */
export async function submitQuickBooking(
  values: QuickBookingFormValues,
): Promise<QuickBookingSubmission> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    ...values,
    id: `mock-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
}
