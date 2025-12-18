import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('categoryId') categoryId?: string,
    @Query('active') active?: string,
    @Query('hasStock') hasStock?: string,
    @Query('hasPromotionalPrice') hasPromotionalPrice?: string,
  ) {
    const filters: any = {};

    if (categoryId) filters.categoryId = parseInt(categoryId);
    if (active !== undefined) filters.active = active === 'true';
    if (hasStock !== undefined) filters.hasStock = hasStock === 'true';
    if (hasPromotionalPrice !== undefined) {
      filters.hasPromotionalPrice = hasPromotionalPrice === 'true';
    }

    return this.productsService.findAll({ page, limit }, filters);
  }

  @Get('without-stock')
  getProductsWithoutStock() {
    return this.productsService.getProductsWithoutStock();
  }

  @Get('with-promotional-price')
  getProductsWithPromotionalPrice() {
    return this.productsService.getProductsWithPromotionalPrice();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':productId/stock/:storeId')
  async updateStock(
    @Param('productId') productId: number,
    @Param('storeId') storeId: number,
    @Body() updateStockDto: UpdateStockDto, // ← Isso é essencial
  ) {
    return this.productsService.updateStock(
      +productId,
      +storeId,
      updateStockDto,
    );
  }

  @Get('without-category')
  @ApiOperation({
    summary: 'Listar produtos na categoria "Sem Categoria"',
    description:
      'Retorna produtos que foram movidos para a categoria padrão quando sua categoria original foi inativada',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos na categoria padrão',
  })
  async getProductsWithoutCategory() {
    return this.productsService.getProductsWithoutCategory();
  }

  @Get('without-category/count')
  @ApiOperation({
    summary: 'Contar produtos na categoria "Sem Categoria"',
    description: 'Retorna a quantidade de produtos na categoria padrão',
  })
  @ApiResponse({
    status: 200,
    description: 'Contagem de produtos na categoria padrão',
  })
  async getProductsWithoutCategoryCount() {
    return this.productsService.getProductsCountWithoutCategory();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
