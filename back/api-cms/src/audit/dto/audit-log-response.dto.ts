import { ApiProperty } from '@nestjs/swagger';
import { AuditAction, EntityType, StoreType } from '@prisma/client';

export class AuditLogResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ required: false, nullable: true })
  userId?: number | null;

  @ApiProperty({ enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ enum: EntityType })
  entityType: EntityType;

  @ApiProperty({ required: false, nullable: true })
  entityId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  productId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  categoryId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  storeId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  details?: any;

  @ApiProperty({ required: false, nullable: true })
  ipAddress?: string | null;

  @ApiProperty({ required: false, nullable: true })
  userAgent?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  user?: {
    id: number;
    email: string;
    name: string;
  } | null;

  @ApiProperty({ required: false, nullable: true })
  product?: {
    id: number;
    name: string;
    sku: string;
  } | null;

  @ApiProperty({ required: false, nullable: true })
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;

  @ApiProperty({ required: false, nullable: true })
  store?: {
    id: number;
    name: string;
    type: StoreType;
  } | null;
}
