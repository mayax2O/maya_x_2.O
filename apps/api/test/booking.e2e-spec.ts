import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { hashPassword } from "../src/auth/password.util";
import { PrismaService } from "../src/database/prisma.service";

describe("Booking API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAccessToken: string;
  let memberAccessToken: string;
  let memberUserId: string;
  let cityId: string;
  let talentId: string;
  let inactiveTalentId: string;

  const adminEmail = `booking.e2e.admin.${Date.now()}@example.com`;
  const memberEmail = `booking.e2e.member.${Date.now()}@example.com`;
  const cityName = `E2E Booking City ${Date.now()}`;
  const talentSlug = `e2e-booking-talent-${Date.now()}`;
  const inactiveTalentSlug = `e2e-booking-inactive-talent-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["/", "health", "health/db"] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);

    await prisma.admin.create({
      data: {
        email: adminEmail,
        fullName: "E2E Booking Admin",
        passwordHash: await hashPassword("AdminPass1"),
      },
    });
    const adminLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: "AdminPass1" });
    adminAccessToken = adminLogin.body.data.accessToken;

    const registerResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: memberEmail,
        password: "MemberPass1",
        fullName: "E2E Booking Member",
      });
    memberAccessToken = registerResponse.body.data.accessToken;
    memberUserId = registerResponse.body.data.user.id;

    const city = await prisma.city.create({
      data: { name: cityName, state: "Test State" },
    });
    cityId = city.id;

    const talent = await prisma.talent.create({
      data: {
        displayName: "E2E Booking Talent",
        slug: talentSlug,
        cityId,
        basePrice: 25000,
      },
    });
    talentId = talent.id;

    const inactiveTalent = await prisma.talent.create({
      data: {
        displayName: "E2E Inactive Talent",
        slug: inactiveTalentSlug,
        cityId,
        basePrice: 25000,
        isActive: false,
      },
    });
    inactiveTalentId = inactiveTalent.id;
  });

  afterAll(async () => {
    await prisma.bookingStatusHistory.deleteMany({
      where: {
        bookingRequest: { talentId: { in: [talentId, inactiveTalentId] } },
      },
    });
    await prisma.bookingRequest.deleteMany({
      where: { talentId: { in: [talentId, inactiveTalentId] } },
    });
    await prisma.talent.deleteMany({
      where: { id: { in: [talentId, inactiveTalentId] } },
    });
    await prisma.city.deleteMany({ where: { id: cityId } });
    await prisma.user.deleteMany({ where: { email: memberEmail } });
    await prisma.admin.deleteMany({ where: { email: adminEmail } });
    await app.close();
  });

  it("rejects a guest submission missing contact fields with 400", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/booking-requests")
      .send({ talentId });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("GUEST_CONTACT_REQUIRED");
  });

  it("rejects a booking against an inactive talent with 404", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/booking-requests")
      .send({
        talentId: inactiveTalentId,
        guestName: "Priya Sharma",
        guestEmail: "priya@example.com",
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("TALENT_NOT_FOUND");
  });

  it("submits a Guest booking request, then the Admin queue and status lifecycle work end-to-end", async () => {
    const create = await request(app.getHttpServer())
      .post("/api/v1/booking-requests")
      .send({
        talentId,
        guestName: "Priya Sharma",
        guestEmail: "priya@example.com",
        guestPhone: "+919876543210",
        eventDate: "2026-12-25",
        eventDetails: "A wedding reception, ~200 guests",
      });

    expect(create.status).toBe(201);
    expect(create.body.data.status).toBe("submitted");
    expect(create.body.data.customer).toEqual({
      type: "guest",
      name: "Priya Sharma",
      email: "priya@example.com",
      phone: "+919876543210",
    });
    const bookingId = create.body.data.id;

    // Guest (no token) cannot fetch the booking directly — only an
    // authenticated principal (Admin, or the owning Member) can.
    const unauthenticatedGet = await request(app.getHttpServer()).get(
      `/api/v1/booking-requests/${bookingId}`,
    );
    expect(unauthenticatedGet.status).toBe(401);

    // Admin queue lists it
    const queue = await request(app.getHttpServer())
      .get("/api/v1/admin/booking-requests")
      .query({ status: "submitted", talentId })
      .set("Authorization", `Bearer ${adminAccessToken}`);
    expect(queue.status).toBe(200);
    expect(
      queue.body.data.some((row: { id: string }) => row.id === bookingId),
    ).toBe(true);

    // Illegal transition rejected
    const illegal = await request(app.getHttpServer())
      .patch(`/api/v1/admin/booking-requests/${bookingId}/status`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({ newStatus: "confirmed" });
    expect(illegal.status).toBe(409);
    expect(illegal.body.error.code).toBe("INVALID_STATUS_TRANSITION");

    // Legal transition: submitted -> under_review
    const toReview = await request(app.getHttpServer())
      .patch(`/api/v1/admin/booking-requests/${bookingId}/status`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({ newStatus: "under_review", notes: "Reviewing request" });
    expect(toReview.status).toBe(200);
    expect(toReview.body.data.status).toBe("under_review");

    // Admin can now fetch the full detail incl. status history
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/booking-requests/${bookingId}`)
      .set("Authorization", `Bearer ${adminAccessToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.statusHistory).toHaveLength(2);
    expect(detail.body.data.statusHistory[0]).toEqual(
      expect.objectContaining({ previousStatus: null, newStatus: "submitted" }),
    );
    expect(detail.body.data.statusHistory[1]).toEqual(
      expect.objectContaining({
        previousStatus: "submitted",
        newStatus: "under_review",
        notes: "Reviewing request",
      }),
    );
  });

  it("submits a Member booking using the bearer token, visible via GET /me/bookings and forbidden to other Members", async () => {
    const create = await request(app.getHttpServer())
      .post("/api/v1/booking-requests")
      .set("Authorization", `Bearer ${memberAccessToken}`)
      .send({ talentId, eventDetails: "Corporate event" });

    expect(create.status).toBe(201);
    expect(create.body.data.customer.type).toBe("member");
    const bookingId = create.body.data.id;

    const mine = await request(app.getHttpServer())
      .get("/api/v1/me/bookings")
      .set("Authorization", `Bearer ${memberAccessToken}`);
    expect(mine.status).toBe(200);
    expect(
      mine.body.data.some((row: { id: string }) => row.id === bookingId),
    ).toBe(true);

    const ownerGet = await request(app.getHttpServer())
      .get(`/api/v1/booking-requests/${bookingId}`)
      .set("Authorization", `Bearer ${memberAccessToken}`);
    expect(ownerGet.status).toBe(200);

    // A different Member is forbidden from viewing it
    await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: `booking.e2e.other.${Date.now()}@example.com`,
        password: "OtherPass1",
        fullName: "Someone Else",
      });
    const otherRegister = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: `booking.e2e.other2.${Date.now()}@example.com`,
        password: "OtherPass1",
        fullName: "Someone Else",
      });
    const otherToken = otherRegister.body.data.accessToken;

    const forbiddenGet = await request(app.getHttpServer())
      .get(`/api/v1/booking-requests/${bookingId}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(forbiddenGet.status).toBe(403);

    await prisma.user.deleteMany({
      where: {
        id: { not: memberUserId },
        email: { contains: "booking.e2e.other" },
      },
    });
  });

  it("rejects a non-Admin from accessing the Admin queue with 403", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/admin/booking-requests")
      .set("Authorization", `Bearer ${memberAccessToken}`);
    expect(response.status).toBe(403);
  });
});
