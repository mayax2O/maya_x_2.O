import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseFilters,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AccessTokenPayload } from "../auth/jwt-payload.interface";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { MembershipService } from "./membership.service";
import type { MembershipPlanResponse } from "./membership-plan.response";

interface DataEnvelope<T> {
  data: T;
}

@Controller("membership-plans")
@UseFilters(DomainHttpExceptionFilter)
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  async findAll(): Promise<DataEnvelope<MembershipPlanResponse[]>> {
    const data = await this.membershipService.findActivePlans();
    return { data };
  }

  @Post(":id/subscribe")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async subscribe(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<DataEnvelope<{ subscriptionId: string; status: string }>> {
    const data = await this.membershipService.subscribe(id, user.sub);
    return { data };
  }
}
