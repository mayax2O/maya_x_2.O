export interface RecentActivityItem {
  id: string;
  type: "talent_created" | "talent_updated" | "user_registered";
  description: string;
  occurredAt: string;
}

export interface LatestRegistrationItem {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalTalent: number;
  activeTalent: number;
  pendingBookings: number;
  todaysBookings: number;
  premiumMembers: number;
  monthlyRevenue: number;
  mockedFields: string[];
  recentActivity: RecentActivityItem[];
  latestRegistrations: LatestRegistrationItem[];
}
