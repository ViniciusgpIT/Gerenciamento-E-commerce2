// update-stock.dto.ts
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateStockDto {
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  minimumStock?: number;

  @IsNumber()
  @IsOptional()
  maximumStock?: number;
}
