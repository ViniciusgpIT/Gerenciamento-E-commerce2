import {
  IsEnum,
  IsOptional,
  IsInt,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AuditAction, EntityType } from '@prisma/client';

export class FilterAuditLogDto {
  @ApiProperty({ required: false, description: 'ID do usuário' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({
    enum: AuditAction,
    required: false,
    description: 'Tipo da ação',
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiProperty({
    enum: EntityType,
    required: false,
    description: 'Tipo da entidade',
  })
  @IsOptional()
  @IsEnum(EntityType)
  entityType?: EntityType;

  @ApiProperty({ required: false, description: 'ID da entidade' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  entityId?: number;

  @ApiProperty({ required: false, description: 'ID do produto' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  productId?: number;

  @ApiProperty({ required: false, description: 'ID da categoria' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  @ApiProperty({ required: false, description: 'ID da loja' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  storeId?: number;

  @ApiProperty({ required: false, description: 'Data inicial (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Data final (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Página', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'Limite por página',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
