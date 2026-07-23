import { authedFetch } from "../api/authFetch";

/** Self-service password change — see apps/api's AuthController for why
 * this is a dedicated endpoint (requires the current password) rather than
 * the generic admin-management PATCH /admins/:id. */
export function changePassword(values: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  return authedFetch<void>("/auth/change-password", {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}
