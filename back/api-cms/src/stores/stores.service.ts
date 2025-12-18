import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStoreDto,
  UpdateStoreDto,
  StoreResponseDto,
} from './dto/create-store.dto';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async create(createStoreDto: CreateStoreDto): Promise<StoreResponseDto> {
    return this.prisma.store.create({
      data: createStoreDto,
    });
  }

  async findAll(includeInactive: boolean = false): Promise<StoreResponseDto[]> {
    const where = includeInactive ? {} : { active: true };

    return this.prisma.store.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number): Promise<StoreResponseDto> {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            stocks: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return store;
  }

  async update(
    id: number,
    updateStoreDto: UpdateStoreDto,
  ): Promise<StoreResponseDto> {
    await this.findOne(id);

    return this.prisma.store.update({
      where: { id },
      data: updateStoreDto,
    });
  }

  async remove(id: number): Promise<void> {
    const store = await this.findOne(id);

    await this.prisma.$transaction([
      this.prisma.stockByStore.deleteMany({
        where: { storeId: id },
      }),
      this.prisma.store.delete({
        where: { id },
      }),
    ]);
  }

  async getStockByStore(storeId: number) {
    const store = await this.findOne(storeId);

    return this.prisma.stockByStore.findMany({
      where: { storeId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            active: true,
          },
        },
      },
    });
  }
}
