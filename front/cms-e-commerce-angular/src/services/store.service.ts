import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Store } from '../models/store.model';
import { map, tap } from 'rxjs';
// FIX: Corrigido o caminho de importação do AuditService.
// O arquivo correto é 'activity-log.service.ts'. Este tipo de erro
// é comum e causa falhas na injeção de dependência.
import { AuditService } from './activity-log.service';
import { AuthService } from './auth.service';
import { API_URL } from '../environments/api.config';

@Injectable({ providedIn: 'root' })
export class StoreService {
  #http = inject(HttpClient);
  #stores = signal<Store[]>([]);
  #auditService = inject(AuditService);
  #authService = inject(AuthService);

  public readonly stores = this.#stores.asReadonly();
  public readonly storeCount = computed(() => this.#stores().length);

  /**
   * Busca lojas da API, com a opção de incluir as inativas.
   * @param includeInactive Se true, busca todas as lojas.
   */
  fetchAll(includeInactive = false) {
    let params = new HttpParams();
    if (includeInactive) {
      params = params.set('includeInactive', 'true');
    }

    // A API retorna um objeto { data: Store[] }, então tipamos a resposta
    // e extraímos a propriedade 'data' para popular nosso signal.
    return this.#http.get<{ data: Store[] }>(`${API_URL}/stores`, { params }).pipe(
      tap(response => this.#stores.set(response.data || []))
    );
  }

  /**
   * Busca uma loja por ID na API.
   */
  getById(id: number) {
    // A API retorna um objeto { data: Store }, então usamos o map para extrair o objeto.
    return this.#http.get<{ data: Store }>(`${API_URL}/stores/${id}`).pipe(
      map(response => response.data)
    );
  }
  
  /**
   * Adiciona uma nova loja via API e atualiza o signal local.
   */
  add(store: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) {
    // A API retorna { data: Store }, então extraímos com map antes do tap.
    return this.#http.post<{ data: Store }>(`${API_URL}/stores`, store).pipe(
      map(response => response.data),
      tap(newStore => {
        this.#stores.update(stores => [...stores, newStore]);
        const userId = this.#authService.currentUser()?.sub;
        if (userId) {
          this.#auditService.createLog({
            userId,
            action: 'CREATE',
            entityType: 'STORE',
            entityId: newStore.id,
            details: { name: newStore.name, type: newStore.type }
          }).subscribe();
        }
      })
    );
  }

  /**
   * Atualiza uma loja existente via API e atualiza o signal local.
   */
  update(updatedStore: Omit<Store, 'createdAt' | 'updatedAt'>) {
    // A API retorna { data: Store }, então extraímos com map antes do tap.
     return this.#http.patch<{ data: Store }>(`${API_URL}/stores/${updatedStore.id}`, updatedStore).pipe(
      map(response => response.data),
      tap(finalStore => {
        this.#stores.update(stores =>
          stores.map(s => s.id === finalStore.id ? finalStore : s)
        );
        const userId = this.#authService.currentUser()?.sub;
        if (userId) {
          this.#auditService.createLog({
            userId,
            action: 'UPDATE',
            entityType: 'STORE',
            entityId: finalStore.id,
            details: { changes: updatedStore }
          }).subscribe();
        }
      })
    );
  }

  /**
   * Remove uma loja via API e atualiza o signal local.
   */
  delete(id: number) {
    const storeToDelete = this.#stores().find(s => s.id === id);
    return this.#http.delete(`${API_URL}/stores/${id}`).pipe(
      tap(() => {
        if (storeToDelete) {
          const userId = this.#authService.currentUser()?.sub;
          if (userId) {
            this.#auditService.createLog({
              userId,
              action: 'DELETE',
              entityType: 'STORE',
              entityId: id,
              details: { name: storeToDelete.name }
            }).subscribe();
          }
        }
        this.#stores.update(stores => stores.filter(s => s.id !== id));
      })
    );
  }
}