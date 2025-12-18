// src/dashboard/dashboard.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('alerts')
  getAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Get('recent-activity')
  getRecentActivity(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.dashboardService.getRecentActivity(limitNum);
  }

  @Get('search')
  searchGlobal(@Query('q') query: string) {
    return this.dashboardService.searchGlobal(query);
  }
}
