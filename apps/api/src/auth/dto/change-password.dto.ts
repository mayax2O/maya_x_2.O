import { IsString, Matches, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  // Same policy as CreateAdminDto/RegisterDto (REST API Specification §2):
  // minimum 8 characters, at least one letter and one number.
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: "newPassword must contain at least one letter and one number",
  })
  newPassword!: string;
}
