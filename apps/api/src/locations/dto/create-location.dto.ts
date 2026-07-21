import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateLocationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsUUID()
  cityId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
