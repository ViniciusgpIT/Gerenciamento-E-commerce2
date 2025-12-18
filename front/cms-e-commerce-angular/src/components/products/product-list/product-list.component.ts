import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { ProductWithDetails } from '../../../models/product.model';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Produtos</h2>
        <!-- O botão só é exibido se o usuário for ADMIN -->
        @if (canManageProducts()) {
          <a routerLink="/products/new" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200">
            Adicionar Produto
          </a>
        }
      </div>
      
      <!-- Bloco de alerta para quando a lista estiver filtrada -->
      @if (filteredCategoryName()) {
        <div class="mb-4 bg-blue-100 border border-blue-200 text-blue-800 px-4 py-3 rounded-md relative" role="alert">
          <span class="block sm:inline">Exibindo apenas produtos da categoria "{{ filteredCategoryName() }}".</span>
          <a routerLink="/products" class="ml-4 font-semibold underline hover:text-blue-900">Limpar filtro</a>
        </div>
      }
    
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-500">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3">Imagem</th>
              <th scope="col" class="px-6 py-3">Nome</th>
              <th scope="col" class="px-6 py-3">SKU</th>
              <th scope="col" class="px-6 py-3">Categoria</th>
              <th scope="col" class="px-6 py-3">Preço</th>
              <th scope="col" class="px-6 py-3">Estoque Total</th>
              <th scope="col" class="px-6 py-3">Status</th>
              <!-- A coluna de Ações só é exibida se o usuário for ADMIN -->
              @if (canManageProducts()) {
                <th scope="col" class="px-6 py-3">Ações</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (product of products(); track product.id) {
              <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4">
                  @if (product.images.length > 0) {
                    <img [src]="product.images[0]" [alt]="product.name" class="w-10 h-10 rounded-lg object-cover">
                  } @else {
                    <div class="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  }
                </td>
                <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{{ product.name }}</td>
                <td class="px-6 py-4 font-mono text-xs">{{ product.sku }}</td>
                <td class="px-6 py-4">{{ product.categoryName }}</td>
                <td class="px-6 py-4">
                    @if(product.promotionalPrice) {
                        <div class="flex flex-col">
                            <span class="font-bold text-indigo-600">{{ product.promotionalPrice | currency:'BRL' }}</span>
                            <span class="text-xs text-gray-500 line-through">{{ product.price | currency:'BRL' }}</span>
                        </div>
                    } @else {
                        <span>{{ product.price | currency:'BRL' }}</span>
                    }
                </td>
                <td class="px-6 py-4 font-bold" [class.text-red-600]="product.totalStock === 0" [class.text-orange-600]="product.totalStock > 0 && product.totalStock <= 10">
                  {{ product.totalStock }}
                </td>
                <td class="px-6 py-4">
                  @if(product.active) {
                    <span class="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Ativo</span>
                  } @else {
                    <span class="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Inativo</span>
                  }
                </td>
                <!-- As ações só são exibidas se o usuário for ADMIN -->
                @if (canManageProducts()) {
                  <td class="px-6 py-4 flex items-center space-x-3">
                    <a [routerLink]="['/products/edit', product.sku]" class="font-medium text-indigo-600 hover:underline">Editar</a>
                    <button (click)="confirmDelete(product)" class="font-medium text-red-600 hover:underline">Remover</button>
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="canManageProducts() ? 8 : 7" class="px-6 py-4 text-center text-gray-500">Nenhum produto encontrado.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Modal de Confirmação de Exclusão -->
    @if(productToDelete(); as product) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
          <h3 class="text-lg font-bold text-gray-900">Confirmar Exclusão</h3>
          <p class="mt-2 text-sm text-gray-600">
            Você tem certeza que deseja remover o produto "{{ product.name }}"? Esta ação não pode ser desfeita.
          </p>
          <div class="mt-6 flex justify-end space-x-3">
            <button (click)="cancelDelete()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Cancelar
            </button>
            <button (click)="deleteProduct()" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
              Remover
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  productService = inject(ProductService);
  notificationService = inject(NotificationService);
  authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);
  
  // Acessa o signal computado do serviço.
  products = this.productService.productsWithDetails;
  
  // Signal para controlar a visibilidade dos botões de gerenciamento.
  canManageProducts = computed(() => this.authService.hasRole('ADMIN'));
  
  productToDelete = signal<ProductWithDetails | null>(null);

  // Signal para exibir o nome da categoria filtrada no alerta.
  filteredCategoryName = signal<string | null>(null);

  ngOnInit(): void {
    // Escuta as mudanças nos parâmetros da URL para aplicar ou limpar o filtro.
    this.route.queryParamMap.subscribe(params => {
      const categoryIdParam = params.get('categoryId');
      
      if (categoryIdParam) {
        const categoryId = +categoryIdParam;
        // Busca a categoria para exibir o nome no alerta
        const category = this.categoryService.categories().find(c => c.id === categoryId);
        this.filteredCategoryName.set(category?.name ?? 'Desconhecida');

        // Busca os produtos filtrando pelo ID da categoria.
        this.productService.fetchAll({ categoryId: categoryId, limit: 100 }).subscribe();
      } else {
        // Se não houver filtro de categoria, limpa o nome e busca todos os produtos.
        this.filteredCategoryName.set(null);
        this.productService.fetchAll({ limit: 100 }).subscribe();
      }
    });
  }

  // Funções para confirmar e executar a exclusão
  confirmDelete(product: ProductWithDetails) {
    this.productToDelete.set(product);
  }
  
  cancelDelete() {
    this.productToDelete.set(null);
  }

  deleteProduct() {
    const product = this.productToDelete();
    if (product) {
      this.productService.delete(product.id).subscribe({
        next: () => {
          this.notificationService.show('Produto removido com sucesso!', 'success');
          this.productToDelete.set(null);
        },
        error: () => this.notificationService.show('Erro ao remover o produto.', 'error'),
      });
    }
  }
}