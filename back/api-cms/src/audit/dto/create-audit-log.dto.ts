import {
  IsEnum,
  IsOptional,
  IsInt,
  IsString,
  IsObject,
  IsIP,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuditAction, EntityType } from '@prisma/client';

export class CreateAuditLogDto {
  @ApiProperty({
    required: false,
    description: 'ID do usuário que realizou a ação',
  })
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiProperty({ enum: AuditAction, description: 'Tipo da ação realizada' })
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiProperty({ enum: EntityType, description: 'Tipo da entidade afetada' })
  @IsEnum(EntityType)
  entityType: EntityType;

  @ApiProperty({ required: false, description: 'ID da entidade principal' })
  @IsOptional()
  @IsInt()
  entityId?: number;

  @ApiProperty({ required: false, description: 'ID do produto (se aplicável)' })
  @IsOptional()
  @IsInt()
  productId?: number;

  @ApiProperty({
    required: false,
    description: 'ID da categoria (se aplicável)',
  })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiProperty({ required: false, description: 'ID da loja (se aplicável)' })
  @IsOptional()
  @IsInt()
  storeId?: number;

  @ApiProperty({
    required: false,
    description: 'Detalhes da ação em formato JSON',
  })
  @IsOptional()
  @IsObject()
  details?: any;

  @ApiProperty({ required: false, description: 'Endereço IP do usuário' })
  @IsOptional()
  @IsString()
  @IsIP()
  ipAddress?: string;

  @ApiProperty({ required: false, description: 'User-Agent do navegador' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
