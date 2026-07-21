import { IsBoolean, IsIn, IsOptional, IsString, IsUUID } from "class-validator";

import type {
  TalentAvailability,
  TalentVerificationStatus,
} from "@prisma/client";

import { BoolQueryParam } from "../../common/dto/bool-query.decorator";
import { ListQueryDto } from "../../common/dto/list-query.dto";

const AVAILABILITY_VALUES: TalentAvailability[] = [
  "available",
  "limited",
  "unavailable",
];
const VERIFICATION_VALUES: TalentVerificationStatus[] = [
  "pending",
  "verified",
  "rejected",
];

export class ListTalentQueryDto extends ListQueryDto {
  @IsOptional()
  @BoolQueryParam()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @BoolQueryParam()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @BoolQueryParam()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsIn(AVAILABILITY_VALUES)
  availability?: TalentAvailability;

  @IsOptional()
  @IsIn(VERIFICATION_VALUES)
  verificationStatus?: TalentVerificationStatus;
}
