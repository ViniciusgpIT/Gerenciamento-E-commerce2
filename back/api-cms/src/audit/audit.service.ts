import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { FilterAuditLogDto } from './dto/filter-audit-log.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async createLog(
    createAuditLogDto: CreateAuditLogDto,
  ): Promise<AuditLogResponseDto> {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: createAuditLogDto,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      this.logger.log(
        `Audit log created: ${auditLog.action} on ${auditLog.entityType} by user ${auditLog.userId}`,
      );

      // Converter para o tipo de resposta
      return this.mapToResponse(auditLog);
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async logLogin(
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.createLog({
      userId,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: userId,
      ipAddress,
      userAgent,
      details: {
        timestamp: new Date().toISOString(),
        action: 'user_login',
      },
    });
  }

  async logLogout(
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.createLog({
      userId,
      action: 'LOGOUT',
      entityType: 'USER',
      entityId: userId,
      ipAddress,
      userAgent,
      details: {
        timestamp: new Date().toISOString(),
        action: 'user_logout',
      },
    });
  }

  async logProductAction(
    userId: number,
    action: string,
    productId: number,
    details?: any,
  ): Promise<void> {
    await this.createLog({
      userId,
      action: action as any,
      entityType: 'PRODUCT',
      entityId: productId,
      productId,
      details,
    });
  }

  async logCategoryAction(
    userId: number,
    action: string,
    categoryId: number,
    details?: any,
  ): Promise<void> {
    await this.createLog({
      userId,
      action: action as any,
      entityType: 'CATEGORY',
      entityId: categoryId,
      categoryId,
      details,
    });
  }

  async logStoreAction(
    userId: number,
    action: string,
    storeId: number,
    details?: any,
  ): Promise<void> {
    await this.createLog({
      userId,
      action: action as any,
      entityType: 'STORE',
      entityId: storeId,
      storeId,
      details,
    });
  }

  async findAll(filterAuditLogDto: FilterAuditLogDto): Promise<{
    data: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      entityType,
      entityId,
      productId,
      categoryId,
      storeId,
      startDate,
      endDate,
    } = filterAuditLogDto;

    const skip = (page - 1) * limit;

    // Construir where clause
    const where: any = {};

    if (userId !== undefined) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId !== undefined) where.entityId = entityId;
    if (productId !== undefined) where.productId = productId;
    if (categoryId !== undefined) where.categoryId = categoryId;
    if (storeId !== undefined) where.storeId = storeId;

    // Filtrar por data
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map((log) => this.mapToResponse(log)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<AuditLogResponseDto> {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return this.mapToResponse(auditLog);
  }

  async getUserActivity(
    userId: number,
    limit = 10,
  ): Promise<AuditLogResponseDto[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs.map((log) => this.mapToResponse(log));
  }

  async getRecentActivity(limit = 20): Promise<AuditLogResponseDto[]> {
    const logs = await this.prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs.map((log) => this.mapToResponse(log));
  }

  private mapToResponse(log: any): AuditLogResponseDto {
    return {
      id: log.id,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      productId: log.productId,
      categoryId: log.categoryId,
      storeId: log.storeId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      user: log.user,
      product: log.product,
      category: log.category,
      store: log.store,
    };
  }
}
