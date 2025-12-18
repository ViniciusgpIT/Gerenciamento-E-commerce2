import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Calça Cargo' })
  @IsString()
  name: string;

   @ApiProperty({ example: 'Calça Cargo Preta' })
  @IsString()
  description: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}

export class CategoryResponseDto {
  id: number;
  name: string;
  description: string;
  slug: string;
  parentId: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  parent?: CategoryResponseDto | null;
  children?: CategoryResponseDto[];
}
