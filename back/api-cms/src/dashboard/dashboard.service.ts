import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async getSummary() {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalCategories,
      totalStores,
      productsWithPromotionalPrice,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.product.count({ where: { active: false } }),
      this.prisma.category.count(),
      this.prisma.store.count(),
      this.prisma.product.count({
        where: {
          promotionalPrice: { not: null },
          active: true,
        },
      }),
    ]);

    const allProducts = await this.prisma.product.findMany({
      include: {
        stocks: true,
      },
    });
    const productsWithoutCategoryResult =
      await this.productsService.getProductsCountWithoutCategory();
    const productsWithoutCategory = productsWithoutCategoryResult.count;

    const productsWithoutStock = allProducts.filter((product) => {
      const totalStock = product.stocks.reduce(
        (sum, stock) => sum + stock.quantity,
        0,
      );
      return totalStock === 0;
    }).length;

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalCategories,
      totalStores,
      productsWithoutStock,
      productsWithPromotionalPrice,
      productsWithoutCategory,
    };
  }

  async getAlerts() {
    const [
      inactiveCategoriesWithProducts,
      productsWithoutImages,
      duplicateSkus,
      criticalStock,
      productsInUncategorized,
    ] = await Promise.all([
      this.getInactiveCategoriesWithProducts(),
      this.getProductsWithoutImages(),
      this.getDuplicateSkus(),
      this.getCriticalStock(),
      this.productsService.getProductsWithoutCategory(),
    ]);

    return {
      inactiveCategoriesWithProducts,
      productsWithoutImages,
      duplicateSkus,
      criticalStock,
      productsInUncategorized,
    };
  }

  async getRecentActivity(limit: number = 10) {
    const recentProducts = await this.prisma.product.findMany({
      take: limit,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        sku: true,
        updatedAt: true,
      },
    });

    const recentCategories = await this.prisma.category.findMany({
      take: limit,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    });

    const recentStores = await this.prisma.store.findMany({
      take: limit,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    });

    return {
      recentProducts,
      recentCategories,
      recentStores,
    };
  }

  async searchGlobal(query: string) {
    if (!query || query.trim().length < 2) {
      return {
        products: [],
        categories: [],
        stores: [],
      };
    }

    const [products, categories, stores] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { eanUpc: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: {
          id: true,
          name: true,
          sku: true,
          active: true,
        },
      }),
      this.prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          active: true,
        },
      }),
      this.prisma.store.findMany({
        where: {
          OR: [{ name: { contains: query, mode: 'insensitive' } }],
        },
        take: 10,
        select: {
          id: true,
          name: true,
          type: true,
          active: true,
        },
      }),
    ]);

    return {
      products,
      categories,
      stores,
    };
  }

  private async getInactiveCategoriesWithProducts() {
    return this.prisma.category.findMany({
      where: {
        active: false,
        products: {
          some: {},
        },
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
          take: 5,
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  private async getProductsWithoutImages() {
    return this.prisma.product.findMany({
      where: {
        images: { equals: [] },
        active: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  private async getDuplicateSkus() {
    const products = await this.prisma.product.findMany({
      select: {
        sku: true,
      },
    });

    const skuCounts: Record<string, number> = {};

    products.forEach((product) => {
      skuCounts[product.sku] = (skuCounts[product.sku] || 0) + 1;
    });

    return Object.entries(skuCounts)
      .filter(([_, count]) => count > 1)
      .map(([sku, count]) => ({ sku, count }));
  }

  private async getCriticalStock() {
    const CRITICAL_THRESHOLD = 5;

    return this.prisma.stockByStore.findMany({
      where: {
        quantity: { lte: CRITICAL_THRESHOLD },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        quantity: 'asc',
      },
    });
  }
}
