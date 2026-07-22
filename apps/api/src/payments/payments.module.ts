import { Module } from "@nestjs/common";

import { AdminPaymentsController } from "./admin-payments.controller";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RAZORPAY_GATEWAY } from "./razorpay-gateway.interface";
import { RazorpayGatewayService } from "./razorpay-gateway.service";

@Module({
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [
    PaymentsService,
    { provide: RAZORPAY_GATEWAY, useClass: RazorpayGatewayService },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
