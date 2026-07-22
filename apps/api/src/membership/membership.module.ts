import { Module } from "@nestjs/common";

import { AdminMembershipController } from "./admin-membership.controller";
import { MembershipController } from "./membership.controller";
import { MembershipService } from "./membership.service";
import { MySubscriptionController } from "./my-subscription.controller";

@Module({
  controllers: [
    MembershipController,
    MySubscriptionController,
    AdminMembershipController,
  ],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
