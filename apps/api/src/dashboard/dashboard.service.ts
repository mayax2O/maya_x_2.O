import { Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";
import type {
  DashboardStatsResponse,
  LatestRegistrationItem,
  RecentActivityItem,
} from "./dashboard.response";

const RECENT_ACTIVITY_LIMIT = 10;
const LATEST_REGISTRATIONS_LIMIT = 5;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStatsResponse> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalTalent,
      activeTalent,
      pendingBookings,
      todaysBookings,
      recentTalent,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.talent.count({ where: { deletedAt: null } }),
      this.prisma.talent.count({
        where: { deletedAt: null, isActive: true },
      }),
      this.prisma.bookingRequest.count({
        where: {
          deletedAt: null,
          status: { in: ["submitted", "under_review", "contacted"] },
        },
      }),
      this.prisma.bookingRequest.count({
        where: { deletedAt: null, createdAt: { gte: startOfToday } },
      }),
      this.prisma.talent.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: RECENT_ACTIVITY_LIMIT,
        select: {
          id: true,
          displayName: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: RECENT_ACTIVITY_LIMIT,
        select: { id: true, fullName: true, email: true, createdAt: true },
      }),
    ]);

    const talentActivity: RecentActivityItem[] = recentTalent.map((talent) => {
      // Same instant (to the second) means this is the row's original
      // INSERT — Prisma's @updatedAt only fires on a real column change.
      const wasJustCreated =
        Math.abs(talent.updatedAt.getTime() - talent.createdAt.getTime()) <
        1000;
      return {
        id: talent.id,
        type: wasJustCreated ? "talent_created" : "talent_updated",
        description: wasJustCreated
          ? `${talent.displayName} was added to the talent catalog`
          : `${talent.displayName}'s profile was updated`,
        occurredAt: talent.updatedAt,
      };
    });

    const userActivity: RecentActivityItem[] = recentUsers.map((user) => ({
      id: user.id,
      type: "user_registered",
      description: `${user.fullName} registered an account`,
      occurredAt: user.createdAt,
    }));

    const recentActivity = [...talentActivity, ...userActivity]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, RECENT_ACTIVITY_LIMIT);

    const latestRegistrations: LatestRegistrationItem[] = recentUsers
      .slice(0, LATEST_REGISTRATIONS_LIMIT)
      .map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
      }));

    return {
      totalUsers,
      totalTalent,
      activeTalent,
      pendingBookings,
      todaysBookings,
      premiumMembers: 0,
      monthlyRevenue: 0,
      mockedFields: ["premiumMembers", "monthlyRevenue"],
      recentActivity,
      latestRegistrations,
    };
  }
}
