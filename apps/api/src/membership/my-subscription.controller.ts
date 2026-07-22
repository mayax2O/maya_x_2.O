import { Controller, Get, UseFilters, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AccessTokenPayload } from "../auth/jwt-payload.interface";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { MembershipService } from "./membership.service";
import type { SubscriptionResponse } from "./subscription.response";

interface DataEnvelope<T> {
  data: T;
}

@Controller("me/subscription")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard)
export class MySubscriptionController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  async findCurrent(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<DataEnvelope<SubscriptionResponse | null>> {
    const data = await this.membershipService.findCurrentSubscription(user.sub);
    return { data };
  }
}
