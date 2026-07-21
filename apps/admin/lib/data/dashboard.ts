import { authedFetch } from "../api/authFetch";
import type { DashboardStats } from "../types";

export function getDashboardStats(): Promise<DashboardStats> {
  return authedFetch<DashboardStats>("/dashboard");
}
