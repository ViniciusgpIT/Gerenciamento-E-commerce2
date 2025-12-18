// src/products/dto/create-product.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class StockByStoreDto {
  @IsInt()
  storeId: number;

  @IsInt()
  @Min(0)
  quantity: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  detailedDescription: string;

  @IsInt()
  categoryId: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  promotionalPrice?: number | null;

  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  eanUpc?: string | null;

  @IsArray()
  @IsString({ each: true })
  sizes: string[];

  @IsArray()
  @IsString({ each: true })
  colors: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  images: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockByStoreDto)
  stock: StockByStoreDto[];

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductResponseDto {
  id: number;
  name: string;
  detailedDescription: string;
  categoryId: number;
  price: number;
  promotionalPrice: number | null;
  sku: string;
  eanUpc: string | null;
  sizes: string[];
  colors: string[];
  images: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: number;
    name: string;
  };
  stock?: StockByStoreDto[];
  totalStock?: number;
}
