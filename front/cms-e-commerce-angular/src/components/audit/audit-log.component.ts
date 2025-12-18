import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { AuditService } from '../../services/activity-log.service';
import { AuditAction, EntityType, AuditLog } from '../../models/activity-log.model';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-audit-log',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">Logs de Auditoria</h2>

      <!-- Formulário de Filtros -->
      <form [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
        <!-- Filtro por Tipo de Entidade -->
        <div>
          <label for="entityType" class="block text-sm font-medium text-gray-700">Entidade</label>
          <select id="entityType" formControlName="entityType" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
            <option [ngValue]="null">Todas</option>
            <option *ngFor="let type of entityTypes" [value]="type">{{ entityTypeMap[type] }}</option>
          </select>
        </div>
        <!-- Filtro por Ação -->
        <div>
          <label for="action" class="block text-sm font-medium text-gray-700">Ação</label>
          <select id="action" formControlName="action" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
            <option [ngValue]="null">Todas</option>
            <option *ngFor="let action of auditActions" [value]="action">{{ actionMap[action] }}</option>
          </select>
        </div>
        <!-- Filtro por Data Inicial -->
        <div>
          <label for="startDate" class="block text-sm font-medium text-gray-700">Data Início</label>
          <input type="date" id="startDate" formControlName="startDate" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
        </div>
        <!-- Filtro por Data Final -->
        <div>
          <label for="endDate" class="block text-sm font-medium text-gray-700">Data Fim</label>
          <input type="date" id="endDate" formControlName="endDate" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
        </div>
        <div class="md:col-span-4 flex justify-end gap-2">
           <button type="button" (click)="resetFilters()" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Limpar</button>
           <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Aplicar Filtros</button>
        </div>
      </form>

      <!-- Tabela de Logs -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-500">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3">Data</th>
              <th scope="col" class="px-6 py-3">Usuário</th>
              <th scope="col" class="px-6 py-3">Ação</th>
              <th scope="col" class="px-6 py-3">Entidade</th>
              <th scope="col" class="px-6 py-3">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            @for (log of auditLogs(); track log.id) {
              <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 text-xs text-gray-600">{{ log.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                <td class="px-6 py-4 font-medium text-gray-800">{{ log.user?.name || 'N/A' }}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-medium rounded-full" [ngClass]="getActionClass(log.action)">
                        {{ actionMap[log.action] || log.action }}
                    </span>
                </td>
                <td class="px-6 py-4">
                  <span class="font-semibold">{{ entityTypeMap[log.entityType] || log.entityType }}:</span>
                  <span class="ml-1">{{ getEntityName(log) }}</span>
                </td>
                <td class="px-6 py-4 text-xs font-mono text-gray-600">
                    <pre class="bg-gray-100 p-2 rounded max-w-xs overflow-auto">{{ log.details | json }}</pre>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">Nenhum log encontrado com os filtros atuais.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      
      <!-- Paginação -->
      <div class="flex justify-between items-center mt-6">
        <span class="text-sm text-gray-700">
          Página {{ currentPage() }} de {{ totalPages() }}. Total de {{ totalRecords() }} registros.
        </span>
        <div class="inline-flex -space-x-px">
          <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1" class="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 disabled:opacity-50">Anterior</button>
          <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()" class="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 disabled:opacity-50">Próximo</button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogComponent implements OnInit {
  auditService = inject(AuditService);
  productService = inject(ProductService);
  categoryService = inject(CategoryService);
  storeService = inject(StoreService);

  // Signals para a UI
  auditLogs = this.auditService.auditLogs;
  currentPage = this.auditService.currentPage;
  totalPages = this.auditService.totalPages;
  totalRecords = this.auditService.totalRecords;

  // Opções para os filtros
  entityTypes: EntityType[] = ['PRODUCT', 'CATEGORY', 'STORE', 'USER'];
  auditActions: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];
  
  // Mapas para tradução na UI
  entityTypeMap: { [key in EntityType]: string } = {
    PRODUCT: 'Produto',
    CATEGORY: 'Categoria',
    STORE: 'Loja',
    USER: 'Usuário'
  };
  actionMap: { [key in AuditAction]: string } = {
    CREATE: 'Criação',
    UPDATE: 'Atualização',
    DELETE: 'Remoção',
    LOGIN: 'Login',
    LOGOUT: 'Logout'
  };

  filterForm = new FormGroup({
    entityType: new FormControl<EntityType | null>(null),
    action: new FormControl<AuditAction | null>(null),
    startDate: new FormControl<string | null>(null),
    endDate: new FormControl<string | null>(null),
  });

  ngOnInit(): void {
    this.fetchLogs();
  }
  
  fetchLogs(page = 1): void {
    const filters = this.filterForm.value;
    this.auditService.findAll({ ...filters, page }).subscribe();
  }
  
  applyFilters(): void {
    this.fetchLogs(1); // Sempre volta para a primeira página ao aplicar filtros
  }
  
  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }
  
  goToPage(page: number): void {
    if (page > 0 && page <= this.totalPages()) {
        this.fetchLogs(page);
    }
  }

  /**
   * Obtém o nome da entidade de forma inteligente.
   * 1. Tenta usar o objeto aninhado (ex: log.product) se o backend o enviar.
   * 2. Se não, busca no cache local dos serviços (ex: productService.products()).
   * 3. Se não encontrar (ex: item deletado), usa o nome salvo nos detalhes do log.
   * 4. Como último recurso, mostra o ID da entidade.
   */
  getEntityName(log: AuditLog): string {
    // Para ações como LOGIN/LOGOUT, o ID da entidade pode ser nulo.
    if (!log.entityId) {
      return log.entityType === 'USER' ? log.user?.name || 'N/A' : 'N/A';
    }

    switch (log.entityType) {
      case 'PRODUCT': {
        const product = this.productService.products().find(p => p.id === log.entityId);
        return log.product?.name || product?.name || log.details?.name || `ID: ${log.entityId}`;
      }
      case 'CATEGORY': {
        const category = this.categoryService.categories().find(c => c.id === log.entityId);
        return log.category?.name || category?.name || log.details?.name || `ID: ${log.entityId}`;
      }
      case 'STORE': {
        const store = this.storeService.stores().find(s => s.id === log.entityId);
        return log.store?.name || store?.name || log.details?.name || `ID: ${log.entityId}`;
      }
      case 'USER':
        // A entidade é o próprio usuário.
        return log.user?.name || `ID: ${log.entityId}`;
      default:
        return `ID: ${log.entityId}`;
    }
  }

  getActionClass(action: AuditAction): string {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'LOGIN': return 'bg-blue-100 text-blue-800';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
