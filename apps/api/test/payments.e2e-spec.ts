import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { hashPassword } from "../src/auth/password.util";
import { PrismaService } from "../src/database/prisma.service";
import { RAZORPAY_GATEWAY } from "../src/payments/razorpay-gateway.interface";

const VALID_SIGNATURE = "valid-test-signature";

/**
 * Stub gateway — this suite never talks to the real Razorpay API. It
 * hands back deterministic orders and accepts exactly one signature
 * value, so the webhook flow (signature check -> state change) can be
 * exercised end-to-end without live credentials.
 */
class StubRazorpayGateway {
  private counter = 0;

  createOrder(params: { amountInSubunits: number; currency: string }) {
    this.counter += 1;
    return Promise.resolve({
      id: `order_stub_${this.counter}`,
      amount: params.amountInSubunits,
      currency: params.currency,
    });
  }

  verifyWebhookSignature(_rawBody: Buffer | string, signature: string) {
    return signature === VALID_SIGNATURE;
  }
}

describe("Membership & Payments API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAccessToken: string;
  let memberAccessToken: string;
  let planId: string;

  const adminEmail = `payments.e2e.admin.${Date.now()}@example.com`;
  const memberEmail = `payments.e2e.member.${Date.now()}@example.com`;
  const planSlug = `e2e-gold-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RAZORPAY_GATEWAY)
      .useClass(StubRazorpayGateway)
      .compile();

    app = moduleRef.createNestApplication({ rawBody: true });
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
        fullName: "E2E Payments Admin",
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
        fullName: "E2E Payments Member",
      });
    memberAccessToken = registerResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.membershipPlan.deleteMany({ where: { slug: planSlug } });
    await prisma.user.deleteMany({ where: { email: memberEmail } });
    await prisma.admin.deleteMany({ where: { email: adminEmail } });
    await app.close();
  });

  it("rejects a non-Admin from creating a membership plan", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/admin/membership-plans")
      .set("Authorization", `Bearer ${memberAccessToken}`)
      .send({
        name: "Gold",
        slug: planSlug,
        price: 4999,
        billingCycle: "monthly",
      });
    expect(response.status).toBe(403);
  });

  it("Admin creates a plan, it's public, then the full subscribe -> order -> webhook flow activates it", async () => {
    const create = await request(app.getHttpServer())
      .post("/api/v1/admin/membership-plans")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({
        name: "Gold",
        slug: planSlug,
        price: 4999,
        billingCycle: "monthly",
        benefits: ["Priority booking review"],
      });
    expect(create.status).toBe(201);
    planId = create.body.data.id;

    const publicList = await request(app.getHttpServer()).get(
      "/api/v1/membership-plans",
    );
    expect(publicList.status).toBe(200);
    expect(
      publicList.body.data.some((plan: { id: string }) => plan.id === planId),
    ).toBe(true);

    // --- Subscribe ---
    const subscribe = await request(app.getHttpServer())
      .post(`/api/v1/membership-plans/${planId}/subscribe`)
      .set("Authorization", `Bearer ${memberAccessToken}`);
    expect(subscribe.status).toBe(201);
    expect(subscribe.body.data.status).toBe("pending_payment");
    const subscriptionId = subscribe.body.data.subscriptionId;

    // Creating an order for someone else's subscription is not permitted.
    const otherRegister = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: `payments.e2e.other.${Date.now()}@example.com`,
        password: "OtherPass1",
        fullName: "Someone Else",
      });
    const otherToken = otherRegister.body.data.accessToken;
    const otherOrderAttempt = await request(app.getHttpServer())
      .post("/api/v1/payments/orders")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ subscriptionId });
    expect(otherOrderAttempt.status).toBe(404);
    await prisma.user.deleteMany({
      where: { email: otherRegister.body.data.user.email },
    });

    // --- Create order (idempotent) ---
    const order = await request(app.getHttpServer())
      .post("/api/v1/payments/orders")
      .set("Authorization", `Bearer ${memberAccessToken}`)
      .send({ subscriptionId });
    expect(order.status).toBe(201);
    expect(order.body.data.razorpayOrderId).toMatch(/^order_stub_/);
    const razorpayOrderId = order.body.data.razorpayOrderId;

    const orderRetry = await request(app.getHttpServer())
      .post("/api/v1/payments/orders")
      .set("Authorization", `Bearer ${memberAccessToken}`)
      .send({ subscriptionId });
    expect(orderRetry.status).toBe(201);
    expect(orderRetry.body.data.razorpayOrderId).toBe(razorpayOrderId);

    // --- Webhook: bad signature rejected ---
    const badWebhook = await request(app.getHttpServer())
      .post("/api/v1/payments/webhook")
      .set("X-Razorpay-Signature", "not-the-right-signature")
      .send({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_e2e_1",
              order_id: razorpayOrderId,
              status: "captured",
            },
          },
        },
      });
    expect(badWebhook.status).toBe(400);

    // --- Webhook: valid signature activates the subscription ---
    const goodWebhook = await request(app.getHttpServer())
      .post("/api/v1/payments/webhook")
      .set("X-Razorpay-Signature", VALID_SIGNATURE)
      .send({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_e2e_1",
              order_id: razorpayOrderId,
              status: "captured",
            },
          },
        },
      });
    expect(goodWebhook.status).toBe(200);

    const mySubscription = await request(app.getHttpServer())
      .get("/api/v1/me/subscription")
      .set("Authorization", `Bearer ${memberAccessToken}`);
    expect(mySubscription.status).toBe(200);
    expect(mySubscription.body.data.status).toBe("active");
    expect(mySubscription.body.data.expiresAt).not.toBeNull();

    // --- Admin reconciliation view ---
    const adminPayments = await request(app.getHttpServer())
      .get("/api/v1/admin/payments")
      .query({ status: "captured" })
      .set("Authorization", `Bearer ${adminAccessToken}`);
    expect(adminPayments.status).toBe(200);
    expect(
      adminPayments.body.data.some(
        (row: { razorpayOrderId: string }) =>
          row.razorpayOrderId === razorpayOrderId,
      ),
    ).toBe(true);

    // --- A second subscribe now correctly rejects (already active) ---
    const secondSubscribe = await request(app.getHttpServer())
      .post(`/api/v1/membership-plans/${planId}/subscribe`)
      .set("Authorization", `Bearer ${memberAccessToken}`);
    expect(secondSubscribe.status).toBe(409);

    await prisma.payment.deleteMany({ where: { subscriptionId } });
    await prisma.subscription.deleteMany({ where: { id: subscriptionId } });
  });

  it("rejects an invalid membership plan payload with 400", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/admin/membership-plans")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({ name: "", price: -5 });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
