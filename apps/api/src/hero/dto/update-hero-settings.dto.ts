import { IsArray, IsEnum, IsUUID } from "class-validator";

export enum HeroModeDto {
  image = "image",
  video = "video",
  slider = "slider",
}

export class UpdateHeroSettingsDto {
  @IsEnum(HeroModeDto)
  mode!: HeroModeDto;

  @IsArray()
  @IsUUID("4", { each: true })
  mediaIds!: string[];
}
