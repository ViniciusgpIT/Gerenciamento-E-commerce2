import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { $Enums } from '@prisma/client'; // Importar enums do Prisma
import { PartialType } from '@nestjs/mapped-types';

export type StoreType = $Enums.StoreType; // Usar o enum do Prisma

export class CreateStoreDto {
  @IsString()
  name: string;

  @IsEnum($Enums.StoreType)
  type: $Enums.StoreType;

  @IsOptional()
  @IsString()
  fullAddress?: string;

  @IsOptional()
  @IsString()
  openingHours?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}

export class UpdateStoreDto extends PartialType(CreateStoreDto) {}

export class StoreResponseDto {
  id: number;
  name: string;
  type: $Enums.StoreType;
  fullAddress: string | null;
  openingHours: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}