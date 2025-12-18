import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { FilterAuditLogDto } from './dto/filter-audit-log.dto';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um log de auditoria' })
  @ApiResponse({ status: 201, description: 'Log criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Body() createAuditLogDto: CreateAuditLogDto) {
    return this.auditService.createLog(createAuditLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar logs de auditoria com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de logs' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@Query() filterAuditLogDto: FilterAuditLogDto) {
    return this.auditService.findAll(filterAuditLogDto);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Obter atividades recentes' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Atividades recentes' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  getRecentActivity(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 20;
    return this.auditService.getRecentActivity(limitNum);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obter atividades de um usuário específico' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Atividades do usuário' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  getUserActivity(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.auditService.getUserActivity(userId, limitNum);
  }

  @Get('my-activity')
  @ApiOperation({ summary: 'Obter minhas atividades' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Minhas atividades' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  getMyActivity(@CurrentUser() user: any, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.auditService.getUserActivity(user.id, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um log de auditoria específico' })
  @ApiResponse({ status: 200, description: 'Log encontrado' })
  @ApiResponse({ status: 404, description: 'Log não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.findOne(id);
  }
}
