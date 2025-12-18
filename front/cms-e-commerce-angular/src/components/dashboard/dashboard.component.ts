import { Component, ChangeDetectionStrategy, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { StoreService } from '../../services/store.service';
import { AuditService } from '../../services/activity-log.service';
import { EntityType, AuditAction, AuditLog } from '../../models/activity-log.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8">
      <div class="flex flex-wrap justify-between items-center gap-4">
        <h1 class="text-3xl font-bold text-gray-800">Painel Geral</h1>
        <!-- Atalhos Rápidos -->
        <div class="flex items-center space-x-2">
            <a routerLink="/products/new" class="bg-indigo-600 text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                Novo Produto
            </a>
            <a routerLink="/categories/new" class="bg-white text-gray-700 px-4 py-2 text-sm font-semibold rounded-lg shadow-md hover:bg-gray-100 border border-gray-300 transition duration-200">Nova Categoria</a>
            <a routerLink="/stores/new" class="bg-white text-gray-700 px-4 py-2 text-sm font-semibold rounded-lg shadow-md hover:bg-gray-100 border border-gray-300 transition duration-200">Nova Loja</a>
        </div>
      </div>
      
      <!-- Grid de cards de estatísticas -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <div class="bg-white p-4 rounded-lg shadow-md"><p class="text-sm font-medium text-gray-500">Produtos Ativos</p><p class="text-3xl font-bold text-gray-800">{{ activeProductCount() }}</p></div>
        <div class="bg-white p-4 rounded-lg shadow-md"><p class="text-sm font-medium text-gray-500">Produtos Inativos</p><p class="text-3xl font-bold text-gray-800">{{ inactiveProductCount() }}</p></div>
        <div class="bg-white p-4 rounded-lg shadow-md"><p class="text-sm font-medium text-gray-500">Categorias</p><p class="text-3xl font-bold text-gray-800">{{ categoryCount() }}</p></div>
        <div class="bg-white p-4 rounded-lg shadow-md"><p class="text-sm font-medium text-gray-500">Lojas</p><p class="text-3xl font-bold text-gray-800">{{ storeCount() }}</p></div>
        <div class="bg-white p-4 rounded-lg shadow-md"><p class="text-sm font-medium text-gray-500">Em Promoção</p><p class="text-3xl font-bold text-gray-800">{{ onSaleProductCount() }}</p></div>
      </div>
    
      <!-- Alertas Recentes -->
      <div>
        <h2 class="text-xl font-bold text-gray-800 mb-4">Alertas Importantes</h2>
        <div class="space-y-4">
            @if (outOfStockProducts().length === 0 && productsWithoutImages().length === 0 && inactiveCategoriesWithProducts().length === 0 && productsWithoutCategoryCount() === 0) {
                <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md" role="alert">
                    <p class="font-bold">Tudo certo!</p>
                    <p>Nenhum alerta importante no momento.</p>
                </div>
            }

            @if(productsWithoutCategoryCount(); as count) {
                @if (count > 0 && uncategorizedCategory(); as uncategorizedCat) {
                    <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
                        <p class="font-bold">Produtos Sem Categoria</p>
                        <p>
                            Existem {{ count }} produto(s) na categoria "{{ uncategorizedCat.name }}". 
                            <a [routerLink]="['/products']" [queryParams]="{ categoryId: uncategorizedCat.id }" class="font-bold text-blue-800 underline hover:text-blue-900">Ver produtos</a> para reclassificá-los.
                        </p>
                    </div>
                }
            }
    
            @if(outOfStockProducts(); as products) {
                @if (products.length > 0) {
                    <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">
                        <p class="font-bold">Estoque Zerado</p>
                        <p>{{ products.length }} produto(s) estão sem estoque em todas as lojas: {{ outOfStockProductNames() }}.</p>
                    </div>
                }
            }
    
            @if(productsWithoutImages(); as products) {
                @if (products.length > 0) {
                    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                        <p class="font-bold">Produtos Sem Imagem</p>
                        <p>{{ products.length }} produto(s) não possuem imagem e não podem ser ativados: {{ productsWithoutImagesNames() }}.</p>
                    </div>
                }
            }
            
            @if(inactiveCategoriesWithProducts(); as categories) {
                @if (categories.length > 0) {
                    <div class="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-md" role="alert">
                        <p class="font-bold">Categorias Inativas com Produtos</p>
                        <p>As seguintes categorias estão inativas mas ainda possuem produtos associados: {{ inactiveCategoriesWithProductsNames() }}.</p>
                    </div>
                }
            }
        </div>
      </div>
    
      <!-- Atividades Recentes -->
      <div>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-800">Atividades Recentes</h2>
          <a routerLink="/audit" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Ver todos os logs</a>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-md">
          <ul class="divide-y divide-gray-200">
            @for (activity of translatedRecentLogs(); track activity.id) {
              <li class="py-3 flex items-start space-x-4">
                <div class="flex-shrink-0">
                  <div class="h-10 w-10 rounded-full flex items-center justify-center" [class]="iconMap[activity.entityType].bgClass">
                      <svg [class]="'h-5 w-5 ' + iconMap[activity.entityType].iconClass" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" [attr.d]="iconMap[activity.entityType].path" clip-rule="evenodd" />
                      </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-800" [innerHTML]="activity.translatedMessage"></p>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ formatRelativeTime(activity.createdAt) }}
                  </p>
                </div>
              </li>
            } @empty {
              <li class="py-3 text-sm text-gray-500 text-center">Nenhuma atividade recente para exibir.</li>
            }
          </ul>
        </div>
      </div>
    
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  // Injeta os serviços para acessar os contadores e alertas computados
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private storeService = inject(StoreService);
  private auditService = inject(AuditService);

  // Lê os signals de contagem diretamente dos serviços.
  // A UI será atualizada automaticamente se esses valores mudarem.
  productCount = this.productService.productCount;
  activeProductCount = this.productService.activeProductCount;
  inactiveProductCount = this.productService.inactiveProductCount;
  outOfStockProducts = this.productService.outOfStockProducts;
  onSaleProductCount = this.productService.onSaleProductCount;
  
  categoryCount = this.categoryService.categoryCount;
  storeCount = this.storeService.storeCount;

  // Alertas
  productsWithoutImages = this.productService.productsWithoutImages;
  inactiveCategoriesWithProducts = this.productService.inactiveCategoriesWithProducts;
  productsWithoutCategoryCount = this.productService.productsWithoutCategoryCount;
  uncategorizedCategory = this.categoryService.uncategorizedCategory;
  
  // Atividades Recentes
  private recentLogs = this.auditService.recentLogs;

  ngOnInit(): void {
    // Busca as atividades recentes ao inicializar o componente.
    this.auditService.getRecentActivity(10).subscribe();
  }

  // Computed signals para formatar os nomes para exibição no template.
  outOfStockProductNames = computed(() => this.outOfStockProducts().map(p => p.name).join(', '));
  productsWithoutImagesNames = computed(() => this.productsWithoutImages().map(p => p.name).join(', '));
  inactiveCategoriesWithProductsNames = computed(() => this.inactiveCategoriesWithProducts().map(c => c.name).join(', '));

  // Mapa para configurar os ícones e cores para cada tipo de entidade no log de atividades.
  iconMap: { [key in EntityType]: { path: string; bgClass: string; iconClass: string; } } = {
    PRODUCT: {
        path: 'M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z',
        bgClass: 'bg-indigo-100',
        iconClass: 'text-indigo-600'
    },
    CATEGORY: {
        path: 'M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
        bgClass: 'bg-green-100',
        iconClass: 'text-green-600'
    },
    STORE: {
        path: 'M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v1H8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 001-1v-1h3v1zM12 9a1 1 0 11-2 0 1 1 0 012 0z',
        bgClass: 'bg-blue-100',
        iconClass: 'text-blue-600'
    },
    USER: { // Adicionado para logs de login/logout
        path: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z',
        bgClass: 'bg-gray-100',
        iconClass: 'text-gray-600'
    }
  };

  private entityTypeMap: { [key in EntityType]: string } = {
    PRODUCT: 'O produto',
    CATEGORY: 'A categoria',
    STORE: 'A loja',
    USER: 'O usuário'
  };

  private actionMap: { [key in AuditAction]: string } = {
    CREATE: 'criou',
    UPDATE: 'atualizou',
    DELETE: 'removeu',
    LOGIN: 'realizou login',
    LOGOUT: 'realizou logout'
  };

  translatedRecentLogs = computed(() => {
    const logs = this.recentLogs();
    // FIX: Adiciona uma verificação para garantir que 'logs' é um array.
    // Isso previne o erro '...map is not a function' se a API retornar um
    // formato inesperado e permite que o resto do componente renderize.
    if (!Array.isArray(logs)) {
      console.error('Dados de "atividades recentes" não são um array:', logs);
      return []; // Retorna um array vazio para evitar a quebra.
    }
    return logs.map(log => {
      const user = log.user?.name ? `<span class="font-semibold">${log.user.name}</span>` : `Usuário ID ${log.userId}`;
      const action = this.actionMap[log.action] || log.action.toLowerCase();
      let message = `${user} ${action}.`;

      if (log.action !== 'LOGIN' && log.action !== 'LOGOUT') {
        const entityType = this.entityTypeMap[log.entityType] || log.entityType;
        const entityName = log.product?.name || log.category?.name || log.store?.name || `ID ${log.entityId}`;
        message = `${user} ${action} ${entityType.toLowerCase()} <span class="font-semibold">"${entityName}"</span>.`;
      }
      
      return { ...log, translatedMessage: message };
    });
  });

  formatRelativeTime(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return `agora mesmo`;
    if (diffMinutes < 60) return `há ${diffMinutes} minuto(s)`;
    if (diffHours < 24) return `há ${diffHours} hora(s)`;
    if (diffDays === 1) return `ontem`;
    return `há ${diffDays} dia(s)`;
  }
}