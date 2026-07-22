import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AccessTokenPayload } from "../auth/jwt-payload.interface";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { CreateMembershipPlanDto } from "./dto/create-membership-plan.dto";
import { UpdateMembershipPlanDto } from "./dto/update-membership-plan.dto";
import { MembershipService } from "./membership.service";
import type { MembershipPlanResponse } from "./membership-plan.response";

interface DataEnvelope<T> {
  data: T;
}

@Controller("admin/membership-plans")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminMembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  async findAll(): Promise<DataEnvelope<MembershipPlanResponse[]>> {
    const data = await this.membershipService.findAllForAdmin();
    return { data };
  }

  @Post()
  async create(
    @Body() dto: CreateMembershipPlanDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<DataEnvelope<MembershipPlanResponse>> {
    const data = await this.membershipService.create(dto, user.sub);
    return { data };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateMembershipPlanDto,
  ): Promise<DataEnvelope<MembershipPlanResponse>> {
    const data = await this.membershipService.update(id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.membershipService.remove(id);
  }
}
