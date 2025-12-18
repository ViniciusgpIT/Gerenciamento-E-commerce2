

import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { ProductWithDetails } from '../../models/product.model';

@Component({
  selector: 'app-storefront',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8">
      <h1 class="text-3xl font-bold text-gray-800">Vitrine de Produtos</h1>
    
      @if (activeProducts().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (product of activeProducts(); track product.id) {
            <div class="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group">
              <!-- Imagem do Produto -->
              <div class="relative w-full h-56 bg-gray-200">
                @if (product.images.length > 0) {
                  <img [src]="product.images[0]" [alt]="product.name" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 O 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                }
              </div>
              
              <!-- Conteúdo do Card -->
              <div class="p-4 flex flex-col flex-grow">
                <h3 class="text-lg font-semibold text-gray-800 mb-2 truncate">{{ product.name }}</h3>
                
                <!-- Preço -->
                <div class="mb-4">
                  @if(product.promotionalPrice) {
                    <div class="flex items-baseline gap-2">
                      <span class="text-2xl font-bold text-indigo-600">{{ product.promotionalPrice | currency:'BRL' }}</span>
                      <span class="text-md text-gray-500 line-through">{{ product.price | currency:'BRL' }}</span>
                    </div>
                  } @else {
                    <span class="text-2xl font-bold text-gray-800">{{ product.price | currency:'BRL' }}</span>
                  }
                </div>
    
                <!-- Status do Estoque -->
                <div class="text-sm font-medium mb-4">
                  @if(product.totalStock > 10) {
                    <span class="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">Em Estoque</span>
                  } @else if (product.totalStock > 0) {
                    <span class="px-2 py-1 text-xs text-orange-800 bg-orange-100 rounded-full">Estoque Baixo</span>
                  } @else {
                    <span class="px-2 py-1 text-xs text-red-800 bg-red-100 rounded-full">Fora de Estoque</span>
                  }
                </div>
    
                <!-- Botão de Ação -->
                <div class="mt-auto">
                  <a [routerLink]="['/product', product.sku]" class="block text-center w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200" [class.bg-gray-400]="product.totalStock === 0" [class.pointer-events-none]="product.totalStock === 0">
                    Ver Detalhes
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="bg-white p-6 rounded-lg shadow-md text-center">
          <p class="text-gray-500">Nenhum produto ativo para exibir na vitrine no momento.</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorefrontComponent {
  private productService = inject(ProductService);

  // Signal computado para obter apenas produtos ativos para a vitrine.
  // A vitrine não deve mostrar produtos que estão inativos no CMS.
  activeProducts = computed(() => {
    return this.productService.productsWithDetails().filter(p => p.active);
  });
}