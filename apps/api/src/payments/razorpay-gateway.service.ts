import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Razorpay from "razorpay";

import type { EnvConfig } from "../config/env.validation";
import type {
  CreateOrderParams,
  CreatedOrder,
  RazorpayGateway,
} from "./razorpay-gateway.interface";

@Injectable()
export class RazorpayGatewayService implements RazorpayGateway {
  private readonly client: Razorpay;
  private readonly webhookSecret: string;

  constructor(configService: ConfigService<EnvConfig, true>) {
    this.client = new Razorpay({
      key_id: configService.get("RAZORPAY_KEY_ID", { infer: true }),
      key_secret: configService.get("RAZORPAY_KEY_SECRET", { infer: true }),
    });
    this.webhookSecret = configService.get("RAZORPAY_WEBHOOK_SECRET", {
      infer: true,
    });
  }

  async createOrder(params: CreateOrderParams): Promise<CreatedOrder> {
    const order = await this.client.orders.create({
      amount: params.amountInSubunits,
      currency: params.currency,
      receipt: params.receipt,
    });
    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
    };
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
    return Razorpay.validateWebhookSignature(
      rawBody.toString(),
      signature,
      this.webhookSecret,
    );
  }
}
