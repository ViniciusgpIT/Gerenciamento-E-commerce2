import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Product, ProductWithDetails } from '../models/product.model';
import { CategoryService } from './category.service';
import { map, tap, of } from 'rxjs';
// FIX: Corrigido o caminho de importação do AuditService.
// O nome do arquivo é 'activity-log.service.ts'. Este ajuste garante que
// o serviço de auditoria seja injetado corretamente.
import { AuditService } from './activity-log.service';
import { AuthService } from './auth.service';
import { API_URL } from '../environments/api.config';

// Interface para os filtros da busca de produtos
export interface ProductFilters {
  page?: number;
  limit?: number;
  categoryId?: number;
  storeId?: number;
  hasStock?: boolean;
  hasPromotionalPrice?: boolean;
}

// Interface para a resposta paginada de produtos do backend.
interface PaginatedProducts {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  #http = inject(HttpClient);
  #products = signal<Product[]>([]);
  #categoryService = inject(CategoryService);
  #auditService = inject(AuditService);
  #authService = inject(AuthService);

  public readonly products = this.#products.asReadonly();
  public readonly productCount = computed(() => this.#products().length);
  
  public readonly activeProductCount = computed(() => this.#products().filter(p => p.active).length);
  public readonly inactiveProductCount = computed(() => this.#products().filter(p => !p.active).length);
  public readonly outOfStockProducts = computed(() => this.#products().filter(p => (p.stocks?.reduce((acc, s) => acc + s.quantity, 0) ?? 0) === 0));
  public readonly onSaleProductCount = computed(() => this.#products().filter(p => p.promotionalPrice != null && p.promotionalPrice > 0).length);
  public readonly productsWithoutImages = computed(() => this.#products().filter(p => !p.images || p.images.length === 0));
  public readonly inactiveCategoriesWithProducts = computed(() => {
      const inactiveCategories = this.#categoryService.categories().filter(c => !c.active);
      const products = this.#products();
      return inactiveCategories.filter(cat => products.some(p => p.categoryId === cat.id));
  });
  
  // A contagem de produtos sem categoria agora é um signal computado.
  // Ele reage automaticamente a mudanças nos produtos ou na definição da categoria "Sem Categoria".
  public readonly productsWithoutCategoryCount = computed(() => {
    const uncategorizedCat = this.#categoryService.uncategorizedCategory();
    if (!uncategorizedCat) {
      return 0; // Se a categoria especial não existir, a contagem é zero.
    }
    // Filtra os produtos que pertencem à categoria "Sem Categoria".
    return this.#products().filter(p => p.categoryId === uncategorizedCat.id).length;
  });

  public readonly productsWithDetails = computed((): ProductWithDetails[] => {
    const products = this.#products();
    const categories = this.#categoryService.categories();
    return products.map(product => ({
      ...product,
      // Usamos o nome da categoria que vem no objeto do produto, se existir.
      // Caso contrário, buscamos no serviço de categorias como antes (fallback).
      categoryName: product.category?.name ?? categories.find(c => c.id === product.categoryId)?.name ?? 'N/A',
      totalStock: product.stocks?.reduce((acc, s) => acc + s.quantity, 0) ?? 0
    }));
  });

  /**
   * Busca produtos da API com base em filtros.
   * @param filters Objeto com os filtros a serem aplicados.
   */
  fetchAll(filters: ProductFilters = {}) {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString());
    if (filters.storeId) params = params.set('storeId', filters.storeId.toString());
    if (filters.hasStock !== undefined) params = params.set('hasStock', String(filters.hasStock));
    if (filters.hasPromotionalPrice !== undefined) params = params.set('hasPromotionalPrice', String(filters.hasPromotionalPrice));
    
    // FIX: A API retorna o objeto de paginação diretamente.
    // Alterado o tipo esperado para PaginatedProducts e o acesso para response.data.
    return this.#http.get<PaginatedProducts>(`${API_URL}/products`, { params }).pipe(
      tap(response => this.#products.set(response.data || []))
    );
  }
  
  /**
   * Busca um produto por ID na API.
   */
  getById(id: number) {
    // A API retorna um objeto { data: Product }, então usamos o map para extrair o objeto.
    return this.#http.get<{ data: Product }>(`${API_URL}/products/${id}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Busca um produto por SKU.
   * Prioriza a busca no cache local para performance e consistência dos dados.
   * @param sku O SKU do produto a ser buscado.
   */
  getBySku(sku: string) {
    // Primeiro, tenta encontrar o produto no cache local (o signal #products).
    // Isso é muito mais rápido e garante consistência com os dados da lista,
    // corrigindo o bug onde a API retornava o produto errado.
    const productFromCache = this.#products().find(p => p.sku === sku);
    if (productFromCache) {
        // Se encontrado, retorna imediatamente como um Observable, sem chamar a API.
        return of(productFromCache);
    }

    // Se o produto não estiver no cache (ex: acesso direto pela URL),
    // mantém a busca na API como um fallback para garantir que os dados sejam carregados.
    const params = new HttpParams().set('sku', sku);
    return this.#http.get<{ data: Product[] }>(`${API_URL}/products`, { params }).pipe(
        map(response => response.data?.[0])
    );
  }

  /**
   * Adiciona um novo produto via API e atualiza o signal local.
   */
  add(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'>) {
    // FIX: Alinha o payload de criação com o de atualização, que espera 'stock'.
    // O backend provavelmente usa DTOs consistentes para o manuseio de estoque.
    const { stocks, ...rest } = product;
    const payload: any = { ...rest };
    if (stocks) {
        payload.stock = stocks; // Renomeia 'stocks' para 'stock'.
    }

    // A API retorna { data: Product }, então extraímos com map antes do tap.
    return this.#http.post<{ data: Product }>(`${API_URL}/products`, payload).pipe(
      map(response => response.data),
      tap(newProduct => {
        this.#products.update(products => [...products, newProduct]);
        const userId = this.#authService.currentUser()?.sub;
        if (userId) {
          this.#auditService.createLog({
            userId,
            action: 'CREATE',
            entityType: 'PRODUCT',
            entityId: newProduct.id,
            details: { name: newProduct.name, sku: newProduct.sku }
          }).subscribe();
        }
      })
    );
  }

  /**
   * Atualiza um produto existente via API e atualiza o signal local.
   * @param id O ID do produto a ser atualizado.
   * @param payload Um objeto contendo apenas os campos a serem alterados.
   */
  update(id: number, payload: Partial<Product>) {
    // FIX: O método agora aceita um payload parcial, que é o correto para PATCH.
    // A única transformação necessária é renomear 'stocks' para 'stock', se presente.
    const { stocks, ...rest } = payload;
    const apiPayload: any = { ...rest };
    if (stocks) {
        apiPayload.stock = stocks; // Renomeia 'stocks' para 'stock'.
    }

    // Enviamos o payload parcial para a API.
    return this.#http.patch<{ data: Product }>(`${API_URL}/products/${id}`, apiPayload).pipe(
      map(response => response.data),
      tap(finalProduct => {
        this.#products.update(products =>
          products.map(p => p.id === finalProduct.id ? finalProduct : p)
        );
        const userId = this.#authService.currentUser()?.sub;
        if (userId) {
          this.#auditService.createLog({
            userId,
            action: 'UPDATE',
            entityType: 'PRODUCT',
            entityId: finalProduct.id,
            details: { changes: payload }
          }).subscribe();
        }
      })
    );
  }

  /**
   * Remove um produto via API e atualiza o signal local.
   */
  delete(id: number) {
    const productToDelete = this.#products().find(p => p.id === id);
     return this.#http.delete(`${API_URL}/products/${id}`).pipe(
      tap(() => {
        if (productToDelete) {
          const userId = this.#authService.currentUser()?.sub;
          if (userId) {
            this.#auditService.createLog({
              userId,
              action: 'DELETE',
              entityType: 'PRODUCT',
              entityId: id,
              details: { name: productToDelete.name, sku: productToDelete.sku }
            }).subscribe();
          }
        }
        this.#products.update(products => products.filter(p => p.id !== id));
      })
    );
  }
}