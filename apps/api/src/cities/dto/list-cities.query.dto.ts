import { IsBoolean, IsOptional } from "class-validator";

import { BoolQueryParam } from "../../common/dto/bool-query.decorator";
import { ListQueryDto } from "../../common/dto/list-query.dto";

export class ListCitiesQueryDto extends ListQueryDto {
  @IsOptional()
  @BoolQueryParam()
  @IsBoolean()
  isActive?: boolean;
}
