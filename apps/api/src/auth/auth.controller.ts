import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";

import type { EnvConfig } from "../config/env.validation";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { AuthService } from "./auth.service";
import type { AuthUserResponse } from "./auth.response";
import { CurrentUser } from "./decorators/current-user.decorator";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { AccessTokenPayload } from "./jwt-payload.interface";
import {
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
} from "./refresh-cookie.util";

interface DataEnvelope<T> {
  data: T;
}

interface AuthResponseBody {
  accessToken: string;
  user: AuthUserResponse;
}

// Tighter than the app-wide default (see main.ts / ThrottlerModule) — brute
// force protection on the two credential-guessing endpoints.
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller("auth")
@UseFilters(DomainHttpExceptionFilter)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @Throttle(AUTH_THROTTLE)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<DataEnvelope<AuthResponseBody>> {
    const result = await this.authService.register(dto);
    setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenExpiresAt,
      this.configService,
    );
    return { data: { accessToken: result.accessToken, user: result.user } };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<DataEnvelope<AuthResponseBody>> {
    const result = await this.authService.login(dto);
    setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenExpiresAt,
      this.configService,
    );
    return { data: { accessToken: result.accessToken, user: result.user } };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<DataEnvelope<{ accessToken: string }>> {
    const rawRefreshToken = (
      req.cookies as Record<string, string> | undefined
    )?.[REFRESH_TOKEN_COOKIE];
    const result = await this.authService.refresh(rawRefreshToken);
    setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenExpiresAt,
      this.configService,
    );
    return { data: { accessToken: result.accessToken } };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const rawRefreshToken = (
      req.cookies as Record<string, string> | undefined
    )?.[REFRESH_TOKEN_COOKIE];
    await this.authService.logout(rawRefreshToken);
    clearRefreshTokenCookie(res, this.configService);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<DataEnvelope<AuthUserResponse>> {
    const data = await this.authService.me(user);
    return { data };
  }

  @Patch("change-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(user, dto);
  }
}
