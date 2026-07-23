import { randomUUID } from "crypto";

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import type { EnvConfig } from "../config/env.validation";
import { PrismaService } from "../database/prisma.service";
import { toAuthUserResponse, type AuthUserResponse } from "./auth.response";
import type { ChangePasswordDto } from "./dto/change-password.dto";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";
import type {
  AccessTokenPayload,
  PrincipalType,
  RefreshTokenPayload,
} from "./jwt-payload.interface";
import { hashPassword, verifyPassword } from "./password.util";
import { hashRefreshToken, parseDurationMs } from "./token.util";

const INVALID_CREDENTIALS_ERROR = {
  code: "INVALID_CREDENTIALS",
  message: "Invalid email or password.",
};

// After this many consecutive failed attempts, the account is locked for
// LOCKOUT_DURATION_MS. Applies to customer (User) logins only — the ERD's
// user_credentials table carries the lockout columns; admin_users
// deliberately does not, so admin login has no lockout in this milestone.
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60_000;

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface AuthResult extends IssuedTokens {
  user: AuthUserResponse;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException({
        code: "USER_EMAIL_CONFLICT",
        message: "A user with this email already exists.",
      });
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          phone: dto.phone,
        },
      });
      await tx.userCredential.create({
        data: {
          userId: created.id,
          passwordHash,
          passwordChangedAt: new Date(),
        },
      });
      return created;
    });

    const roles = ["user"];
    const tokens = await this.issueTokenPair(user.id, "user", roles);

    return { ...tokens, user: toAuthUserResponse(user, "user", roles) };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      include: { credential: true },
    });

    if (user?.credential) {
      return this.loginAsUser(user, user.credential, dto.password);
    }

    const admin = await this.prisma.admin.findFirst({
      where: { email: dto.email, deletedAt: null, isActive: true },
      include: { adminUserRoles: { include: { role: true } } },
    });

    if (admin) {
      return this.loginAsAdmin(admin, dto.password);
    }

    throw new UnauthorizedException(INVALID_CREDENTIALS_ERROR);
  }

  private async loginAsUser(
    user: { id: string; email: string; fullName: string },
    credential: {
      passwordHash: string;
      failedLoginAttempts: number;
      lockedUntil: Date | null;
    },
    plainTextPassword: string,
  ): Promise<AuthResult> {
    if (credential.lockedUntil && credential.lockedUntil > new Date()) {
      throw new UnauthorizedException({
        code: "ACCOUNT_LOCKED",
        message: "Too many failed attempts. Try again later.",
      });
    }

    const isValid = await verifyPassword(
      credential.passwordHash,
      plainTextPassword,
    );

    if (!isValid) {
      const failedLoginAttempts = credential.failedLoginAttempts + 1;
      const lockedUntil =
        failedLoginAttempts >= LOCKOUT_THRESHOLD
          ? new Date(Date.now() + LOCKOUT_DURATION_MS)
          : null;

      await this.prisma.userCredential.update({
        where: { userId: user.id },
        data: { failedLoginAttempts, lockedUntil },
      });

      throw new UnauthorizedException(INVALID_CREDENTIALS_ERROR);
    }

    await this.prisma.userCredential.update({
      where: { userId: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const roles = ["user"];
    const tokens = await this.issueTokenPair(user.id, "user", roles);
    return { ...tokens, user: toAuthUserResponse(user, "user", roles) };
  }

  private async loginAsAdmin(
    admin: {
      id: string;
      email: string;
      fullName: string;
      passwordHash: string;
      adminUserRoles: { role: { name: string } }[];
    },
    plainTextPassword: string,
  ): Promise<AuthResult> {
    const isValid = await verifyPassword(admin.passwordHash, plainTextPassword);
    if (!isValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_ERROR);
    }

    const roles = Array.from(
      new Set([
        "admin",
        ...admin.adminUserRoles.map((entry) => entry.role.name),
      ]),
    );
    const tokens = await this.issueTokenPair(admin.id, "admin", roles);
    return { ...tokens, user: toAuthUserResponse(admin, "admin", roles) };
  }

  async refresh(rawRefreshToken: string | undefined): Promise<IssuedTokens> {
    const payload = await this.verifyRefreshToken(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      stored.tokenHash !== hashRefreshToken(rawRefreshToken as string)
    ) {
      throw new UnauthorizedException({
        code: "REFRESH_TOKEN_INVALID",
        message: "Invalid or expired refresh token.",
      });
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const roles = await this.currentRoles(payload.sub, payload.type);
    return this.issueTokenPair(payload.sub, payload.type, roles);
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(rawRefreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(payload: AccessTokenPayload): Promise<AuthUserResponse> {
    if (payload.type === "user") {
      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, deletedAt: null },
      });
      if (!user) {
        throw new UnauthorizedException(INVALID_CREDENTIALS_ERROR);
      }
      return toAuthUserResponse(user, "user", ["user"]);
    }

    const admin = await this.prisma.admin.findFirst({
      where: { id: payload.sub, deletedAt: null },
      include: { adminUserRoles: { include: { role: true } } },
    });
    if (!admin) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_ERROR);
    }
    const roles = Array.from(
      new Set([
        "admin",
        ...admin.adminUserRoles.map((entry) => entry.role.name),
      ]),
    );
    return toAuthUserResponse(admin, "admin", roles);
  }

  // Self-service password change — requires the current password, unlike
  // PATCH /admins/:id (which lets an admin reset another admin's password
  // on admin-role authority alone, no current-password check needed there).
  // Scoped to Admin principals only; Users don't have this UI yet.
  async changePassword(
    payload: AccessTokenPayload,
    dto: ChangePasswordDto,
  ): Promise<void> {
    if (payload.type !== "admin") {
      throw new UnauthorizedException(INVALID_CREDENTIALS_ERROR);
    }

    const admin = await this.prisma.admin.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!admin) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_ERROR);
    }

    const isValid = await verifyPassword(
      admin.passwordHash,
      dto.currentPassword,
    );
    if (!isValid) {
      throw new UnauthorizedException({
        code: "CURRENT_PASSWORD_INCORRECT",
        message: "Current password is incorrect.",
      });
    }

    const passwordHash = await hashPassword(dto.newPassword);
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash },
    });
  }

  private async currentRoles(
    principalId: string,
    type: PrincipalType,
  ): Promise<string[]> {
    if (type === "user") return ["user"];

    const admin = await this.prisma.admin.findFirst({
      where: { id: principalId, deletedAt: null },
      include: { adminUserRoles: { include: { role: true } } },
    });
    return Array.from(
      new Set([
        "admin",
        ...(admin?.adminUserRoles.map((entry) => entry.role.name) ?? []),
      ]),
    );
  }

  private async verifyRefreshToken(
    rawRefreshToken: string | undefined,
  ): Promise<RefreshTokenPayload> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException({
        code: "REFRESH_TOKEN_MISSING",
        message: "No refresh token was provided.",
      });
    }

    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(
        rawRefreshToken,
        {
          secret: this.configService.get("JWT_REFRESH_SECRET", { infer: true }),
        },
      );
    } catch {
      throw new UnauthorizedException({
        code: "REFRESH_TOKEN_INVALID",
        message: "Invalid or expired refresh token.",
      });
    }
  }

  private async issueTokenPair(
    principalId: string,
    type: PrincipalType,
    roles: string[],
  ): Promise<IssuedTokens> {
    const jti = randomUUID();
    const refreshExpiresIn = this.configService.get("JWT_REFRESH_EXPIRES_IN", {
      infer: true,
    });
    const accessExpiresIn = this.configService.get("JWT_ACCESS_EXPIRES_IN", {
      infer: true,
    });
    const refreshTokenExpiresAt = new Date(
      Date.now() + parseDurationMs(refreshExpiresIn),
    );

    const refreshPayload: RefreshTokenPayload = { sub: principalId, type, jti };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.get("JWT_REFRESH_SECRET", { infer: true }),
      expiresIn: refreshExpiresIn,
    });

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: refreshTokenExpiresAt,
        userId: type === "user" ? principalId : null,
        adminUserId: type === "admin" ? principalId : null,
      },
    });

    const accessPayload: AccessTokenPayload = { sub: principalId, type, roles };
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configService.get("JWT_ACCESS_SECRET", { infer: true }),
      expiresIn: accessExpiresIn,
    });

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }
}
