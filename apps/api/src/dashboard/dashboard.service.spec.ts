import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { PrismaService } from "../database/prisma.service";
import { DashboardService } from "./dashboard.service";

describe("DashboardService", () => {
  let service: DashboardService;
  let prisma: {
    user: { count: jest.Mock; findMany: jest.Mock };
    talent: { count: jest.Mock; findMany: jest.Mock };
    bookingRequest: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { count: jest.fn(), findMany: jest.fn() },
      talent: { count: jest.fn(), findMany: jest.fn() },
      bookingRequest: { count: jest.fn() },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(DashboardService);
  });

  it("reports real counts and clearly labels the mocked fields", async () => {
    prisma.user.count.mockResolvedValue(42);
    prisma.talent.count.mockResolvedValueOnce(10).mockResolvedValueOnce(7);
    prisma.bookingRequest.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);
    prisma.talent.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([]);

    const result = await service.getStats();

    expect(result.totalUsers).toBe(42);
    expect(result.totalTalent).toBe(10);
    expect(result.activeTalent).toBe(7);
    expect(result.pendingBookings).toBe(3);
    expect(result.todaysBookings).toBe(2);
    expect(result.mockedFields).toEqual(["premiumMembers", "monthlyRevenue"]);
  });

  it("merges talent and user activity, sorted most-recent first", async () => {
    prisma.user.count.mockResolvedValue(1);
    prisma.talent.count.mockResolvedValue(1);
    prisma.bookingRequest.count.mockResolvedValue(0);
    prisma.talent.findMany.mockResolvedValue([
      {
        id: "t1",
        displayName: "Ananya Rao",
        createdAt: new Date("2026-07-20T10:00:00Z"),
        updatedAt: new Date("2026-07-20T10:00:00Z"),
      },
    ]);
    prisma.user.findMany.mockResolvedValue([
      {
        id: "u1",
        fullName: "Arjun Mehta",
        email: "arjun@example.com",
        createdAt: new Date("2026-07-21T09:00:00Z"),
      },
    ]);

    const result = await service.getStats();

    expect(result.recentActivity[0]?.type).toBe("user_registered");
    expect(result.recentActivity[1]?.type).toBe("talent_created");
    expect(result.latestRegistrations).toHaveLength(1);
    expect(result.latestRegistrations[0]?.email).toBe("arjun@example.com");
  });

  it("labels a talent as updated (not created) when updatedAt is well after createdAt", async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.talent.count.mockResolvedValue(1);
    prisma.bookingRequest.count.mockResolvedValue(0);
    prisma.talent.findMany.mockResolvedValue([
      {
        id: "t1",
        displayName: "Ananya Rao",
        createdAt: new Date("2026-07-01T10:00:00Z"),
        updatedAt: new Date("2026-07-20T10:00:00Z"),
      },
    ]);
    prisma.user.findMany.mockResolvedValue([]);

    const result = await service.getStats();

    expect(result.recentActivity[0]?.type).toBe("talent_updated");
  });
});
