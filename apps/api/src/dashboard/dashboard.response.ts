export interface RecentActivityItem {
  id: string;
  type: "talent_created" | "talent_updated" | "user_registered";
  description: string;
  occurredAt: Date;
}

export interface LatestRegistrationItem {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
}

export interface DashboardStatsResponse {
  totalUsers: number;
  totalTalent: number;
  activeTalent: number;
  /** Count of booking requests still awaiting resolution (submitted/under_review/contacted). */
  pendingBookings: number;
  /** Count of booking requests created today (server-local calendar day). */
  todaysBookings: number;
  /** Placeholder — customer Membership/Subscription is out of scope until that milestone. */
  premiumMembers: number;
  /** Placeholder — Booking/Payment is out of scope until that milestone. */
  monthlyRevenue: number;
  /** Which of the fields above are mocked, so the UI can badge them honestly rather than presenting fake numbers as real. */
  mockedFields: (keyof Pick<
    DashboardStatsResponse,
    "premiumMembers" | "monthlyRevenue"
  >)[];
  recentActivity: RecentActivityItem[];
  latestRegistrations: LatestRegistrationItem[];
}
