import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  StockByStoreDto,
} from './dto/create-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingSku) {
      throw new ConflictException('SKU already exists');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.active) {
      throw new BadRequestException(
        'Cannot associate with an inactive category',
      );
    }

    await this.validateStocks(createProductDto.stock);

    if (
      createProductDto.active &&
      (!createProductDto.images || createProductDto.images.length === 0)
    ) {
      throw new BadRequestException(
        'Active products must have at least one image',
      );
    }

    if (createProductDto.active && !category.active) {
      throw new BadRequestException(
        'Cannot activate product with inactive category',
      );
    }

    // Criar o produto sem o campo 'stock' (usar apenas 'stocks')
    const { stock, ...productData } = createProductDto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        stocks: {
          create: stock.map((stockItem) => ({
            storeId: stockItem.storeId,
            quantity: stockItem.quantity,
          })),
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        stocks: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return {
      ...product,
      totalStock: product.stocks.reduce(
        (sum, stockItem) => sum + stockItem.quantity,
        0,
      ),
    };
  }

  async getProductsWithoutCategory(): Promise<ProductResponseDto[]> {
    // Primeiro, obtenha a categoria "Sem Categoria"
    const uncategorizedCategory = await this.prisma.category.findUnique({
      where: { slug: 'sem-categoria' },
    });

    // Se não existir a categoria padrão, retornar array vazio
    if (!uncategorizedCategory) {
      console.log('Categoria "Sem Categoria" não encontrada');
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: {
        categoryId: uncategorizedCategory.id,
        active: true, // Opcional: filtrar apenas produtos ativos
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        stocks: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return products.map((product) => ({
      ...product,
      totalStock: product.stocks.reduce(
        (sum, stock) => sum + stock.quantity,
        0,
      ),
    }));
  }

  async getProductsCountWithoutCategory(): Promise<{ count: number }> {
    const uncategorizedCategory = await this.prisma.category.findUnique({
      where: { slug: 'sem-categoria' },
    });

    if (!uncategorizedCategory) {
      return { count: 0 };
    }

    const count = await this.prisma.product.count({
      where: {
        categoryId: uncategorizedCategory.id,
        active: true, // Opcional
      },
    });

    return { count };
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      categoryId?: number;
      active?: boolean;
      hasStock?: boolean;
      hasPromotionalPrice?: boolean;
    },
  ): Promise<PaginatedResponse<ProductResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters) {
      if (filters.categoryId !== undefined) {
        where.categoryId = filters.categoryId;
      }
      if (filters.active !== undefined) {
        where.active = filters.active;
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          stocks: {
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const processedProducts = products
      .map((product) => ({
        ...product,
        totalStock: product.stocks.reduce(
          (sum, stockItem) => sum + stockItem.quantity,
          0,
        ),
      }))
      .filter((product) => {
        if (filters?.hasStock !== undefined) {
          if (filters.hasStock && product.totalStock === 0) return false;
          if (!filters.hasStock && product.totalStock > 0) return false;
        }
        if (filters?.hasPromotionalPrice !== undefined) {
          if (filters.hasPromotionalPrice && !product.promotionalPrice)
            return false;
          if (!filters.hasPromotionalPrice && product.promotionalPrice)
            return false;
        }
        return true;
      });

    return {
      data: processedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        stocks: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      ...product,
      totalStock: product.stocks.reduce(
        (sum, stockItem) => sum + stockItem.quantity,
        0,
      ),
    };
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.findOne(id);

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku },
      });

      if (existingSku) {
        throw new ConflictException('SKU already exists');
      }
    }

    if (
      updateProductDto.categoryId &&
      updateProductDto.categoryId !== product.categoryId
    ) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (!category.active) {
        throw new BadRequestException(
          'Cannot associate with an inactive category',
        );
      }
    }

    if (updateProductDto.stock) {
      await this.validateStocks(updateProductDto.stock);
    }

    if (updateProductDto.active !== undefined && updateProductDto.active) {
      const images = updateProductDto.images || product.images;
      if (!images || images.length === 0) {
        throw new BadRequestException(
          'Active products must have at least one image',
        );
      }

      const categoryId = updateProductDto.categoryId || product.categoryId;
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category || !category.active) {
        throw new BadRequestException(
          'Cannot activate product with inactive category',
        );
      }
    }

    const { stock, ...updateData } = updateProductDto;

    const updatedProduct = await this.prisma.$transaction(async (tx) => {
      if (stock) {
        await tx.stockByStore.deleteMany({
          where: { productId: id },
        });
      }

      const productData: any = { ...updateData };

      if (stock) {
        productData.stocks = {
          create: stock.map((stockItem) => ({
            storeId: stockItem.storeId,
            quantity: stockItem.quantity,
          })),
        };
      }

      const updated = await tx.product.update({
        where: { id },
        data: productData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          stocks: {
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      return updated;
    });

    return {
      ...updatedProduct,
      totalStock: updatedProduct.stocks.reduce(
        (sum, stockItem) => sum + stockItem.quantity,
        0,
      ),
    };
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async updateStock(
    productId: number,
    storeId: number,
    data: UpdateStockDto,
  ): Promise<void> {
    await this.findOne(productId);
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    // Cria objeto com apenas os campos definidos
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );

    await this.prisma.stockByStore.upsert({
      where: {
        productId_storeId: {
          productId,
          storeId,
        },
      },
      create: {
        productId,
        storeId,
        ...updateData, // Usa spread operator para todos os campos
      },
      update: {
        ...updateData, // Atualiza todos os campos fornecidos
      },
    });
  }

  async getProductsWithoutStock(): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        stocks: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return products
      .filter((product) => {
        const totalStock = product.stocks.reduce(
          (sum, stockItem) => sum + stockItem.quantity,
          0,
        );
        return totalStock === 0;
      })
      .map((product) => ({
        ...product,
        totalStock: 0,
      }));
  }

  async getProductsWithPromotionalPrice(): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        promotionalPrice: { not: null },
        active: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        stocks: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return products.map((product) => ({
      ...product,
      totalStock: product.stocks.reduce(
        (sum, stockItem) => sum + stockItem.quantity,
        0,
      ),
    }));
  }

  private async validateStocks(stocks: StockByStoreDto[]): Promise<void> {
    for (const stockItem of stocks) {
      const store = await this.prisma.store.findUnique({
        where: { id: stockItem.storeId },
      });

      if (!store) {
        throw new NotFoundException(
          `Store with ID ${stockItem.storeId} not found`,
        );
      }

      if (!store.active) {
        throw new BadRequestException(
          `Cannot add stock to inactive store (ID: ${stockItem.storeId})`,
        );
      }
    }
  }
}
