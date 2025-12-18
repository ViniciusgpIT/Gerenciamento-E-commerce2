// Define os tipos de ação e entidade, espelhando o enum do Prisma no back-end.
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
export type EntityType = 'PRODUCT' | 'CATEGORY' | 'STORE' | 'USER';

// Define a estrutura para um único registro de log de auditoria, conforme a resposta da API.
export interface AuditLog {
  id: number;
  userId: number | null;
  action: AuditAction;
  entityType: EntityType;
  entityId: number | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string; // As datas são recebidas como strings ISO 8601.
  updatedAt: string;

  // Relações que podem ser incluídas na resposta da API.
  user?: {
    id: number;
    email: string;
    name: string;
  } | null;
  product?: {
    id: number;
    name: string;
    sku: string;
  } | null;
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  store?: {
    id: number;
    name: string;
    type: 'FISICA' | 'ONLINE';
  } | null;
}

// Interface para a resposta paginada da API de auditoria.
export interface PaginatedAuditLogs {
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}


// Interface para os filtros da busca de logs de auditoria.
export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userId?: number;
  action?: AuditAction;
  entityType?: EntityType;
  startDate?: string;
  endDate?: string;
}

// Define a estrutura para criar um novo log.
export interface CreateAuditLog {
  userId: number;
  action: AuditAction;
  entityType: EntityType;
  entityId: number;
  details?: any;
}
