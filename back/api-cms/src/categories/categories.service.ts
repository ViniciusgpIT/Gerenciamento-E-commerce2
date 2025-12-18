import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  CategoryResponseDto,
} from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // Método para obter ou criar a categoria padrão "Sem Categoria"
  private async getOrCreateUncategorizedCategory() {
    const uncategorizedSlug = 'sem-categoria';

    let uncategorizedCategory = await this.prisma.category.findUnique({
      where: { slug: uncategorizedSlug },
    });

    if (!uncategorizedCategory) {
      uncategorizedCategory = await this.prisma.category.create({
        data: {
          name: 'Sem Categoria',
          description: 'Categoria padrão para produtos sem categoria definida',
          slug: uncategorizedSlug,
          active: true,
        },
      });
      console.log(`✅ Categoria padrão criada: ${uncategorizedCategory.name}`);
    }

    return uncategorizedCategory;
  }

  // Método para mover produtos de uma categoria (e suas subcategorias) para a categoria padrão
  private async moveProductsToUncategorized(categoryId: number): Promise<void> {
    const uncategorizedCategory = await this.getOrCreateUncategorizedCategory();

    // Encontrar todas as subcategorias (incluindo a categoria principal)
    const getAllSubcategories = async (parentId: number): Promise<number[]> => {
      const subcategories = await this.prisma.category.findMany({
        where: { parentId },
        select: { id: true },
      });

      const subcategoryIds = subcategories.map((sc) => sc.id);
      let allSubcategoryIds = [...subcategoryIds];

      for (const subId of subcategoryIds) {
        const deeperSubs = await getAllSubcategories(subId);
        allSubcategoryIds = [...allSubcategoryIds, ...deeperSubs];
      }

      return allSubcategoryIds;
    };

    // Obter IDs de todas as subcategorias (incluindo a categoria principal)
    const allCategoryIds = [
      categoryId,
      ...(await getAllSubcategories(categoryId)),
    ];

    // Contar produtos afetados
    const productCount = await this.prisma.product.count({
      where: {
        categoryId: {
          in: allCategoryIds,
        },
      },
    });

    if (productCount > 0) {
      // Mover todos os produtos para a categoria padrão
      await this.prisma.product.updateMany({
        where: {
          categoryId: {
            in: allCategoryIds,
          },
        },
        data: {
          categoryId: uncategorizedCategory.id,
        },
      });

      console.log(
        `📦 ${productCount} produto(s) movido(s) para a categoria "Sem Categoria"`,
      );
    }
  }

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    // Check if slug already exists
    const existingSlug = await this.prisma.category.findUnique({
      where: { slug: createCategoryDto.slug },
    });

    if (existingSlug) {
      throw new ConflictException('Slug already exists');
    }

    // Check parent category if provided
    if (createCategoryDto.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      if (!parentCategory.active) {
        throw new BadRequestException(
          'Cannot associate with an inactive parent category',
        );
      }

      const depth = await this.getCategoryDepth(createCategoryDto.parentId);
      if (depth >= 3) {
        throw new BadRequestException(
          'Maximum category depth (3 levels) exceeded',
        );
      }
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });

    return this.mapCategoryToResponse(category);
  }

  async findAll(
    includeInactive: boolean = false,
  ): Promise<CategoryResponseDto[]> {
    const where = includeInactive ? {} : { active: true };

    const categories = await this.prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((category) => this.mapCategoryToResponse(category));
  }

  async findOne(id: number): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.mapCategoryToResponse(category);
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.findOne(id);

    // Check if slug already exists (if changing)
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingSlug = await this.prisma.category.findUnique({
        where: { slug: updateCategoryDto.slug },
      });

      if (existingSlug) {
        throw new ConflictException('Slug already exists');
      }
    }

    // Check parent category if changing
    if (
      updateCategoryDto.parentId !== undefined &&
      updateCategoryDto.parentId !== category.parentId
    ) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      if (updateCategoryDto.parentId !== null) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { id: updateCategoryDto.parentId },
        });

        if (!parentCategory) {
          throw new NotFoundException('Parent category not found');
        }

        const isCircular = await this.checkCircularReference(
          id,
          updateCategoryDto.parentId,
        );
        if (isCircular) {
          throw new BadRequestException('Circular reference detected');
        }

        const depth = await this.getCategoryDepth(updateCategoryDto.parentId);
        if (depth >= 3) {
          throw new BadRequestException(
            'Maximum category depth (3 levels) exceeded',
          );
        }
      }
    }

    // REGRA DE NEGÓCIO: Se estiver inativando a categoria
    if (updateCategoryDto.active === false && category.active === true) {
      // 1. Mover todos os produtos para a categoria padrão
      await this.moveProductsToUncategorized(id);

      // 2. Inativar todas as subcategorias
      await this.deactivateChildren(id);
    }

    // Business rule: If parent is being deactivated, cannot activate this category
    if (updateCategoryDto.active === true && category.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: category.parentId },
      });

      if (parentCategory && !parentCategory.active) {
        throw new BadRequestException(
          'Não é possível ativar a categoria com um pai inativo.',
        );
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });

    return this.mapCategoryToResponse(updatedCategory);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);

    // Check if category has products
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      // Mover produtos para categoria padrão antes de excluir
      await this.moveProductsToUncategorized(id);
    }

    // Check if category has children
    const childCount = await this.prisma.category.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      // Mover produtos das subcategorias para categoria padrão
      await this.moveProductsToUncategorized(id);

      // Excluir subcategorias
      await this.prisma.category.deleteMany({
        where: { parentId: id },
      });
    }

    await this.prisma.category.delete({
      where: { id },
    });
  }

  async getHierarchy(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null, active: true },
      include: {
        children: {
          where: { active: true },
          include: {
            children: {
              where: { active: true },
              include: {
                children: {
                  where: { active: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((category) => this.mapCategoryToResponse(category));
  }

  private mapCategoryToResponse(category: any): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      parentId: category.parentId,
      active: category.active,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      parent: category.parent
        ? this.mapCategoryToResponse(category.parent)
        : null,
      children: category.children?.map((child) =>
        this.mapCategoryToResponse(child),
      ),
    };
  }

  private async getCategoryDepth(
    categoryId: number,
    currentDepth: number = 0,
  ): Promise<number> {
    if (currentDepth >= 3) return currentDepth;

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { parentId: true },
    });

    if (!category || !category.parentId) {
      return currentDepth;
    }

    return this.getCategoryDepth(category.parentId, currentDepth + 1);
  }

  private async deactivateChildren(parentId: number): Promise<void> {
    const children = await this.prisma.category.findMany({
      where: { parentId },
    });

    for (const child of children) {
      // Mover produtos da subcategoria para categoria padrão
      await this.moveProductsToUncategorized(child.id);

      // Inativar a subcategoria
      await this.prisma.category.update({
        where: { id: child.id },
        data: { active: false },
      });

      await this.deactivateChildren(child.id);
    }
  }

  private async checkCircularReference(
    categoryId: number,
    potentialParentId: number,
  ): Promise<boolean> {
    if (categoryId === potentialParentId) return true;

    let currentParentId = potentialParentId;
    while (currentParentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });

      if (!parent || !parent.parentId) {
        break;
      }

      if (parent.parentId === categoryId) {
        return true;
      }

      currentParentId = parent.parentId;
    }

    return false;
  }
}
