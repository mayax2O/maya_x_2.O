import { IsUUID } from "class-validator";

export class CreatePaymentOrderDto {
  @IsUUID()
  subscriptionId!: string;
}
