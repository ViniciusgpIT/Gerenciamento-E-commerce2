

import { Injectable, signal, inject } from '@angular/core';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { StoreService } from './store.service';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
import { Store } from '../models/store.model';

// Define a estrutura para os resultados da busca.
export interface SearchResult {
  products: Product[];
  categories: Category[];
  stores: Store[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private storeService = inject(StoreService);

  // Signals para gerenciar o estado dos resultados e a visibilidade do painel.
  #results = signal<SearchResult | null>(null);
  #isResultsVisible = signal(false);

  // Expõe os signals como somente leitura para os componentes.
  public readonly results = this.#results.asReadonly();
  public readonly isResultsVisible = this.#isResultsVisible.asReadonly();

  /**
   * Executa a busca em produtos, categorias e lojas.
   * @param term O termo a ser buscado.
   */
  search(term: string): void {
    const searchTerm = term.toLowerCase().trim();

    if (!searchTerm) {
      this.hideResults();
      return;
    }

    // A busca de produtos agora inclui a verificação do campo 'sku'.
    // Um produto será retornado se o termo de busca estiver contido
    // no nome OU no SKU do produto.
    const products = this.productService.products().filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm))
    );
    const categories = this.categoryService.categories().filter(c => c.name.toLowerCase().includes(searchTerm));
    const stores = this.storeService.stores().filter(s => s.name.toLowerCase().includes(searchTerm));

    this.#results.set({ products, categories, stores });
    this.#isResultsVisible.set(true);
  }

  /**
   * Esconde o painel de resultados da busca.
   */
  hideResults(): void {
    this.#isResultsVisible.set(false);
  }
}