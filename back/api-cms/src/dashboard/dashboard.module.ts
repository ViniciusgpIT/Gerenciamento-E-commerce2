// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ProductsModule } from '../products/products.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
