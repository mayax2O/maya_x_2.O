import { PartialType } from "@nestjs/mapped-types";

import { CreateTalentCategoryDto } from "./create-talent-category.dto";

export class UpdateTalentCategoryDto extends PartialType(
  CreateTalentCategoryDto,
) {}
