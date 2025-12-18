

import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white p-6 md:p-8 rounded-lg shadow-md max-w-6xl mx-auto">
      @if (productDetails(); as product) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <!-- Coluna da Galeria de Imagens -->
          <div class="space-y-4">
            <!-- Imagem Principal -->
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              @if (selectedImage()) {
                <img [src]="selectedImage()" [alt]="product.name" class="w-full h-full object-cover">
              } @else {
                <svg class="h-24 w-24 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            </div>
            <!-- Miniaturas (Thumbnails) -->
            @if (product.images.length > 1) {
              <div class="grid grid-cols-5 gap-2">
                @for (image of product.images; track image; let i = $index) {
                  <div (click)="selectImage(image)" class="aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer border-2 transition" [class.border-indigo-500]="selectedImage() === image" [class.border-transparent]="selectedImage() !== image">
                    <img [src]="image" [alt]="'Thumbnail ' + (i + 1)" class="w-full h-full object-cover">
                  </div>
                }
              </div>
            }
          </div>
    
          <!-- Coluna de Informações do Produto -->
          <div class="flex flex-col">
            <a routerLink="/storefront" class="text-sm text-indigo-600 hover:underline mb-2 inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Voltar para a Vitrine
            </a>
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{{ product.name }}</h1>
            <p class="text-md text-gray-500 mb-4">{{ product.categoryName }}</p>
    
            <!-- Preço -->
            <div class="mb-6">
              @if(product.promotionalPrice) {
                <div class="flex items-baseline gap-3">
                  <span class="text-4xl font-bold text-indigo-600">{{ product.promotionalPrice | currency }}</span>
                  <span class="text-xl text-gray-500 line-through">{{ product.price | currency }}</span>
                </div>
              } @else {
                <span class="text-4xl font-bold text-gray-900">{{ product.price | currency }}</span>
              }
            </div>
    
            <!-- Descrição -->
            <div class="prose max-w-none text-gray-600 mb-6">
              <p>{{ product.detailedDescription }}</p>
            </div>
    
            <!-- Variações (Cores e Tamanhos) -->
            <div class="space-y-4 mb-6">
              @if (product.colors.length > 0) {
                <div>
                  <h3 class="text-sm font-medium text-gray-900 mb-2">Cores</h3>
                  <div class="flex flex-wrap gap-2">
                    @for (color of product.colors; track color) {
                      <span class="px-3 py-1 text-sm border border-gray-300 rounded-full">{{ color }}</span>
                    }
                  </div>
                </div>
              }
              @if (product.sizes.length > 0) {
                <div>
                  <h3 class="text-sm font-medium text-gray-900 mb-2">Tamanhos</h3>
                  <div class="flex flex-wrap gap-2">
                    @for (size of product.sizes; track size) {
                      <span class="px-3 py-1 text-sm border border-gray-300 rounded-full">{{ size }}</span>
                    }
                  </div>
                </div>
              }
            </div>
            
            <!-- Estoque -->
            <div class="text-sm font-medium mb-6">
              @if (product.totalStock > 0) {
                <span class="inline-flex items-center gap-2 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                  Em Estoque ({{ product.totalStock }} unidades)
                </span>
              } @else {
                <span class="inline-flex items-center gap-2 text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
                  Fora de Estoque
                </span>
              }
            </div>
    
            <!-- Botão de Ação -->
            <div class="mt-auto">
              <button class="w-full bg-indigo-600 text-white px-6 py-3 text-lg font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 disabled:bg-gray-400" [disabled]="product.totalStock === 0">
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      } @else {
        <!-- Estado de Carregamento ou Produto Não Encontrado -->
        <div class="text-center py-12">
          <p class="text-gray-500">Carregando detalhes do produto...</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  // Converte o Observable de parâmetros da rota em um signal,
  // e busca o produto correspondente sempre que o SKU mudar.
  private product = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => this.productService.getBySku(params.get('sku')!))
    )
  );

  // Signal computado para enriquecer os dados do produto com
  // informações de outras entidades, como o nome da categoria.
  productDetails = computed(() => {
    const prod = this.product();
    if (!prod) {
      return null; // Retorna nulo enquanto o produto está sendo carregado ou se não for encontrado.
    }
    
    const category = this.categoryService.categories().find(c => c.id === prod.categoryId);
    const totalStock = prod.stocks.reduce((acc, s) => acc + s.quantity, 0);

    return {
      ...prod,
      categoryName: category?.name ?? 'N/A',
      totalStock: totalStock
    };
  });

  // Signal para controlar qual imagem está sendo exibida em destaque na galeria.
  selectedImage = signal<string | undefined>(undefined);

  constructor() {
    // Um 'effect' é a maneira correta de reagir a mudanças em signals para
    // executar uma ação, como sincronizar o estado da imagem selecionada
    // quando os dados do produto são carregados.
    effect(() => {
      const images = this.productDetails()?.images;
      if (images && images.length > 0) {
        this.selectedImage.set(images[0]); // Define a primeira imagem como padrão.
      } else {
        this.selectedImage.set(undefined);
      }
    });
  }

  /**
   * Atualiza a imagem selecionada quando o usuário clica em uma miniatura.
   * @param imageUrl A URL da imagem a ser exibida.
   */
  selectImage(imageUrl: string): void {
    this.selectedImage.set(imageUrl);
  }
}