import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap, map } from 'rxjs';
import { API_URL } from '../environments/api.config';
import { AuditLog, PaginatedAuditLogs, AuditLogFilters, CreateAuditLog } from '../models/activity-log.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  #http = inject(HttpClient);

  // Signal para armazenar a lista de logs de auditoria da página de listagem.
  #auditLogs = signal<AuditLog[]>([]);
  public readonly auditLogs = this.#auditLogs.asReadonly();

  // Signal para armazenar os logs recentes para o dashboard.
  #recentLogs = signal<AuditLog[]>([]);
  public readonly recentLogs = this.#recentLogs.asReadonly();
  
  // Signals para o estado da paginação.
  #totalRecords = signal(0);
  #totalPages = signal(0);
  #currentPage = signal(1);
  public readonly totalRecords = this.#totalRecords.asReadonly();
  public readonly totalPages = this.#totalPages.asReadonly();
  public readonly currentPage = this.#currentPage.asReadonly();


  /**
   * Busca logs de auditoria da API com base em filtros e paginação.
   * @param filters Objeto com os filtros a serem aplicados.
   */
  findAll(filters: AuditLogFilters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.#http.get<PaginatedAuditLogs>(`${API_URL}/audit`, { params }).pipe(
      tap(response => {
        this.#auditLogs.set(response.data || []);
        this.#totalRecords.set(response.total);
        this.#totalPages.set(response.totalPages);
        this.#currentPage.set(response.page);
      })
    );
  }

  /**
   * Busca as atividades mais recentes para exibir no dashboard.
   * @param limit O número de registros a serem buscados.
   */
  getRecentActivity(limit = 10) {
    // FIX: A API para logs recentes retorna um objeto { data: AuditLog[] }.
    // O tipo da resposta foi ajustado e agora extraímos a propriedade 'data'
    // antes de popular o signal, resolvendo o erro no dashboard.
    return this.#http.get<{ data: AuditLog[] }>(`${API_URL}/audit/recent?limit=${limit}`).pipe(
      tap(response => this.#recentLogs.set(response.data || []))
    );
  }

  /**
   * Cria um novo registro de log de auditoria no back-end.
   * @param logData Os dados do log a serem criados.
   */
  createLog(logData: CreateAuditLog) {
    // Retorna o Observable para que o serviço que o chama possa se inscrever.
    return this.#http.post(`${API_URL}/audit`, logData);
  }
}