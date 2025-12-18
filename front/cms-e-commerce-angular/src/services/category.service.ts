import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Category } from '../models/category.model';
import { map, tap } from 'rxjs';
// FIX: Corrigido o caminho de importação do AuditService.
// O nome do arquivo é 'activity-log.service.ts', não 'audit.service.ts'.
// Este era um erro de digitação que impedia o TypeScript de encontrar o serviço.
import { AuditService } from './activity-log.service';
import { AuthService } from './auth.service';
import { API_URL } from '../environments/api.config';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  #http = inject(HttpClient);
  #auditService = inject(AuditService);
  #authService = inject(AuthService);

  // O estado é privado para evitar mutações externas.
  #categories = signal<Category[]>([]);
  
  // Exponho o estado como um signal somente leitura.
  public readonly categories = this.#categories.asReadonly();
  public readonly categoryCount = computed(() => this.#categories().length);
  public readonly activeCategories = computed(() => this.#categories().filter(c => c.active));

  // Novo signal computado para encontrar a categoria "Sem Categoria" de forma centralizada.
  public readonly uncategorizedCategory = computed(() => 
    this.#categories().find(c => c.name.toLowerCase() === 'sem categoria')
  );

  /**
   * Busca categorias da API, com a opção de incluir as inativas.
   * @param includeInactive Se true, busca todas as categorias.
   */
  fetchAll(includeInactive = false) {
    let params = new HttpParams();
    if (includeInactive) {
      params = params.set('includeInactive', 'true');
    }

    // A API retorna um objeto { data: Category[] }, então tipamos a resposta
    // e extraímos a propriedade 'data' para popular nosso signal.
    return this.#http.get<{ data: Category[] }>(`${API_URL}/categories`, { params }).pipe(
      tap(response => this.#categories.set(response.data || []))
    );
  }

  /**
   * Busca uma categoria por ID.
   */
  getById(id: number) {
     // A API retorna um objeto { data: Category }, então usamos o map para extrair o objeto.
     return this.#http.get<{ data: Category }>(`${API_URL}/categories/${id}`).pipe(
       map(response => response.data)
     );
  }
  
  /**
   * Busca uma categoria por slug.
   * @param slug O slug da categoria a ser buscada.
   */
  getBySlug(slug: string) {
    // CORREÇÃO: Para manter a consistência com a correção de produtos e seguir
    // um padrão REST comum, a busca por slug também é alterada para usar query parameters.
    const params = new HttpParams().set('slug', slug);
    // A API de categorias, ao ser filtrada, deve retornar um array de categorias dentro da propriedade 'data'.
    return this.#http.get<{ data: Category[] }>(`${API_URL}/categories`, { params }).pipe(
      // O slug é único, então pegamos o primeiro item do array de resposta.
      map(response => response.data?.[0])
    );
  }
  
  /**
   * Adiciona uma nova categoria via API e atualiza o signal local.
   */
  add(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    // A API retorna { data: Category }, então extraímos com map antes do tap.
    return this.#http.post<{ data: Category }>(`${API_URL}/categories`, category).pipe(
      map(response => response.data),
      tap(newCategory => {
        this.#categories.update(categories => [...categories, newCategory]);
        const userId = this.#authService.currentUser()?.sub;
        if (userId) {
          this.#auditService.createLog({
            userId,
            action: 'CREATE',
            entityType: 'CATEGORY',
            entityId: newCategory.id,
            details: { name: newCategory.name, slug: newCategory.slug }
          }).subscribe();
        }
      })
    );
  }

  /**
   * Atualiza uma categoria existente via API e atualiza o signal local.
   * FIX: O ID da categoria agora é separado do payload da requisição PATCH.
   * A versão anterior enviava o ID no corpo, causando um erro '400 Bad Request'
   * do backend. Esta correção alinha o método com as práticas REST e a
   * implementação dos outros serviços (ex: ProductService).
   */
  update(updatedCategory: Partial<Category> & { id: number }) {
    const { id, ...payload } = updatedCategory;
    
    return this.#http.patch<{ data: Category }>(`${API_URL}/categories/${id}`, payload).pipe(
      map(response => response.data),
      tap(finalCategory => {
        this.#categories.update(categories => 
          categories.map(c => c.id === finalCategory.id ? finalCategory : c)
        );
        const userId = this.#authService.currentUser()?.sub;
        if (userId) {
          // A auditoria agora registra apenas o payload de alterações, sem o ID.
          this.#auditService.createLog({
            userId,
            action: 'UPDATE',
            entityType: 'CATEGORY',
            entityId: finalCategory.id,
            details: { changes: payload }
          }).subscribe();
        }
      })
    );
  }

  /**
   * Remove uma categoria via API e atualiza o signal local.
   */
  delete(id: number) {
    const categoryToDelete = this.#categories().find(c => c.id === id);
    return this.#http.delete(`${API_URL}/categories/${id}`).pipe(
      tap(() => {
        if (categoryToDelete) {
          const userId = this.#authService.currentUser()?.sub;
          if (userId) {
            this.#auditService.createLog({
              userId,
              action: 'DELETE',
              entityType: 'CATEGORY',
              entityId: id,
              details: { name: categoryToDelete.name }
            }).subscribe();
          }
        }
        this.#categories.update(categories => categories.filter(c => c.id !== id));
      })
    );
  }
}