import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AccessTokenPayload } from "../auth/jwt-payload.interface";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { CreatePaymentOrderDto } from "./dto/create-payment-order.dto";
import { PaymentsService } from "./payments.service";

interface DataEnvelope<T> {
  data: T;
}

@Controller("payments")
@UseFilters(DomainHttpExceptionFilter)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("orders")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Body() dto: CreatePaymentOrderDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<
    DataEnvelope<{
      razorpayOrderId: string;
      amount: number;
      currency: string;
      razorpayKeyId: string;
    }>
  > {
    const data = await this.paymentsService.createOrder(
      dto.subscriptionId,
      user.sub,
    );
    return { data };
  }

  // No bearer auth: Razorpay calls this server-to-server, authenticated
  // solely via the X-Razorpay-Signature HMAC header (SEC-04, SEC-07) —
  // never trust this route on origin/network alone. No DTO/ValidationPipe
  // either: the payload shape is Razorpay's, not ours, and the raw bytes
  // (not a re-serialized object) are what the signature was computed over.
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-razorpay-signature") signature: string | undefined,
  ): Promise<void> {
    await this.paymentsService.handleWebhook(req.rawBody as Buffer, signature);
  }
}
