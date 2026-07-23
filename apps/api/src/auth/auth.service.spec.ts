import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { PrismaService } from "../database/prisma.service";
import { AuthService } from "./auth.service";
import { hashPassword } from "./password.util";
import { hashRefreshToken } from "./token.util";

const TEST_ENV: Record<string, string> = {
  JWT_ACCESS_SECRET: "access-secret",
  JWT_REFRESH_SECRET: "refresh-secret",
  JWT_ACCESS_EXPIRES_IN: "15m",
  JWT_REFRESH_EXPIRES_IN: "30d",
};

function createConfigServiceMock() {
  return { get: jest.fn((key: string) => TEST_ENV[key]) };
}

function createJwtServiceMock() {
  let counter = 0;
  return {
    signAsync: jest.fn(async (payload: Record<string, unknown>) => {
      counter += 1;
      return `signed.${JSON.stringify(payload)}.${counter}`;
    }),
    verifyAsync: jest.fn(),
  };
}

function createPrismaMock() {
  const prisma = {
    user: { findFirst: jest.fn() },
    userCredential: { create: jest.fn(), update: jest.fn() },
    admin: { findFirst: jest.fn(), update: jest.fn() },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  // register() uses the interactive-transaction form; reuse the same mock
  // object as `tx` so the same jest.fn() call assertions apply either way.
  prisma.$transaction.mockImplementation(
    async (callback: (tx: unknown) => unknown) => callback(prisma),
  );
  return prisma;
}

describe("AuthService", () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwt: ReturnType<typeof createJwtServiceMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    jwt = createJwtServiceMock();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: createConfigServiceMock() },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe("register", () => {
    it("creates a User + UserCredential and issues a token pair with the user role", async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      const createdUser = {
        id: "u1",
        email: "new@example.com",
        fullName: "New User",
      };
      // The interactive transaction mock hands back `prisma` itself as
      // `tx`, so tx.user.create needs its own mock too.
      (prisma as unknown as { user: { create: jest.Mock } }).user.create = jest
        .fn()
        .mockResolvedValue(createdUser);

      const result = await service.register({
        email: "new@example.com",
        fullName: "New User",
        password: "Password1",
      });

      expect(prisma.userCredential.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: "u1" }),
        }),
      );
      expect(result.user).toMatchObject({
        id: "u1",
        email: "new@example.com",
        type: "user",
        roles: ["user"],
      });
      expect(result.accessToken).toEqual(expect.any(String));
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it("rejects a duplicate email with 409 Conflict", async () => {
      prisma.user.findFirst.mockResolvedValue({ id: "existing" });

      await expect(
        service.register({
          email: "taken@example.com",
          fullName: "Someone",
          password: "Password1",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("login", () => {
    it("logs in a User with correct credentials and resets failed attempts", async () => {
      const passwordHash = await hashPassword("Password1");
      prisma.user.findFirst.mockResolvedValue({
        id: "u1",
        email: "user@example.com",
        fullName: "A User",
        credential: { passwordHash, failedLoginAttempts: 2, lockedUntil: null },
      });

      const result = await service.login({
        email: "user@example.com",
        password: "Password1",
      });

      expect(prisma.userCredential.update).toHaveBeenCalledWith({
        where: { userId: "u1" },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      expect(result.user.type).toBe("user");
      expect(result.user.roles).toEqual(["user"]);
    });

    it("increments failedLoginAttempts and rejects on a wrong password", async () => {
      const passwordHash = await hashPassword("CorrectPassword1");
      prisma.user.findFirst.mockResolvedValue({
        id: "u1",
        email: "user@example.com",
        fullName: "A User",
        credential: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      });

      await expect(
        service.login({
          email: "user@example.com",
          password: "WrongPassword1",
        }),
      ).rejects.toMatchObject({
        response: { code: "INVALID_CREDENTIALS" },
      });

      expect(prisma.userCredential.update).toHaveBeenCalledWith({
        where: { userId: "u1" },
        data: { failedLoginAttempts: 1, lockedUntil: null },
      });
    });

    it("locks the account after 5 failed attempts", async () => {
      const passwordHash = await hashPassword("CorrectPassword1");
      prisma.user.findFirst.mockResolvedValue({
        id: "u1",
        email: "user@example.com",
        fullName: "A User",
        credential: { passwordHash, failedLoginAttempts: 4, lockedUntil: null },
      });

      await expect(
        service.login({
          email: "user@example.com",
          password: "WrongPassword1",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      const updateArgs = prisma.userCredential.update.mock.calls[0][0];
      expect(updateArgs.data.failedLoginAttempts).toBe(5);
      expect(updateArgs.data.lockedUntil).toEqual(expect.any(Date));
    });

    it("rejects immediately (without checking the password) while locked", async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: "u1",
        email: "user@example.com",
        fullName: "A User",
        credential: {
          passwordHash: "irrelevant",
          failedLoginAttempts: 5,
          lockedUntil: new Date(Date.now() + 60_000),
        },
      });

      await expect(
        service.login({ email: "user@example.com", password: "anything" }),
      ).rejects.toMatchObject({ response: { code: "ACCOUNT_LOCKED" } });
      expect(prisma.userCredential.update).not.toHaveBeenCalled();
    });

    it("falls back to Admin lookup when no User matches, and includes role names", async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      const passwordHash = await hashPassword("AdminPass1");
      prisma.admin.findFirst.mockResolvedValue({
        id: "a1",
        email: "admin@example.com",
        fullName: "An Admin",
        passwordHash,
        adminUserRoles: [{ role: { name: "super_admin" } }],
      });

      const result = await service.login({
        email: "admin@example.com",
        password: "AdminPass1",
      });

      expect(result.user.type).toBe("admin");
      expect(result.user.roles).toEqual(
        expect.arrayContaining(["admin", "super_admin"]),
      );
    });

    it("rejects with a generic error when neither a User nor an Admin matches", async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.admin.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ email: "nobody@example.com", password: "whatever" }),
      ).rejects.toMatchObject({ response: { code: "INVALID_CREDENTIALS" } });
    });
  });

  describe("refresh", () => {
    it("rotates a valid refresh token: revokes the old row and issues a new pair", async () => {
      const rawToken = "raw-refresh-token";
      jwt.verifyAsync.mockResolvedValue({
        sub: "u1",
        type: "user",
        jti: "rt1",
      });
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt1",
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash: hashRefreshToken(rawToken),
      });

      const result = await service.refresh(rawToken);

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: "rt1" },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result.accessToken).toEqual(expect.any(String));
    });

    it("rejects when no token is provided", async () => {
      await expect(service.refresh(undefined)).rejects.toMatchObject({
        response: { code: "REFRESH_TOKEN_MISSING" },
      });
    });

    it("rejects when the JWT signature/expiry is invalid", async () => {
      jwt.verifyAsync.mockRejectedValue(new Error("bad signature"));

      await expect(service.refresh("bad-token")).rejects.toMatchObject({
        response: { code: "REFRESH_TOKEN_INVALID" },
      });
    });

    it("rejects when the stored row is missing, revoked, expired, or hash-mismatched", async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: "u1",
        type: "user",
        jti: "rt1",
      });
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh("raw-refresh-token")).rejects.toMatchObject({
        response: { code: "REFRESH_TOKEN_INVALID" },
      });
    });
  });

  describe("logout", () => {
    it("revokes the matching, not-yet-revoked refresh token by hash", async () => {
      await service.logout("raw-refresh-token");

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: hashRefreshToken("raw-refresh-token"),
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it("is a no-op when no token is provided", async () => {
      await service.logout(undefined);
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("me", () => {
    it("returns a User profile", async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: "u1",
        email: "user@example.com",
        fullName: "A User",
      });

      const result = await service.me({
        sub: "u1",
        type: "user",
        roles: ["user"],
      });
      expect(result).toMatchObject({ id: "u1", type: "user", roles: ["user"] });
    });

    it("returns an Admin profile with role names", async () => {
      prisma.admin.findFirst.mockResolvedValue({
        id: "a1",
        email: "admin@example.com",
        fullName: "An Admin",
        adminUserRoles: [{ role: { name: "super_admin" } }],
      });

      const result = await service.me({
        sub: "a1",
        type: "admin",
        roles: ["admin", "super_admin"],
      });
      expect(result.roles).toEqual(
        expect.arrayContaining(["admin", "super_admin"]),
      );
    });

    it("throws when the principal no longer exists", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.me({ sub: "gone", type: "user", roles: ["user"] }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("changePassword", () => {
    const adminPayload = {
      sub: "a1",
      type: "admin" as const,
      roles: ["admin"],
    };

    it("updates the password hash when the current password is correct", async () => {
      prisma.admin.findFirst.mockResolvedValue({
        id: "a1",
        passwordHash: await hashPassword("OldPass1"),
      });

      await service.changePassword(adminPayload, {
        currentPassword: "OldPass1",
        newPassword: "NewPass1",
      });

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: "a1" },
        data: { passwordHash: expect.any(String) },
      });
    });

    it("rejects an incorrect current password", async () => {
      prisma.admin.findFirst.mockResolvedValue({
        id: "a1",
        passwordHash: await hashPassword("OldPass1"),
      });

      await expect(
        service.changePassword(adminPayload, {
          currentPassword: "WrongPass1",
          newPassword: "NewPass1",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.admin.update).not.toHaveBeenCalled();
    });

    it("rejects non-admin principals", async () => {
      await expect(
        service.changePassword(
          { sub: "u1", type: "user", roles: ["user"] },
          { currentPassword: "OldPass1", newPassword: "NewPass1" },
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
