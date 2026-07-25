import { IsBoolean, IsOptional, IsUUID } from "class-validator";

import { BoolQueryParam } from "../../common/dto/bool-query.decorator";
import { ListQueryDto } from "../../common/dto/list-query.dto";

export class ListTalentSubCategoriesQueryDto extends ListQueryDto {
  @IsOptional()
  @BoolQueryParam()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
