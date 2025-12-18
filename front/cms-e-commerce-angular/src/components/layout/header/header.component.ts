import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../../services/search.service';
import { LayoutService } from '../../../services/layout.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  template: `
    <header class="fixed top-0 left-0 flex items-center justify-between h-16 px-4 md:px-6 bg-white shadow-md w-full z-30">
      <div class="flex items-center">
        <!-- Botão de Toggle da Sidebar -->
        <button (click)="toggleSidebar()" 
                aria-label="Alternar menu"
                class="p-2 mr-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
          <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <!-- Logo -->
        <a routerLink="/dashboard" class="text-gray-800 flex items-center space-x-2">
          <svg class="w-8 h-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v11.494m-9-5.747h18"/>
          </svg>
          <span class="text-2xl font-extrabold hidden sm:inline">CMS Corp</span>
        </a>
      </div>
    
      <!-- Global Search Bar -->
      <div class="flex items-center flex-1 max-w-xl relative mx-4">
        <form class="flex w-full" (ngSubmit)="onSearch(searchInput.value)">
          <div class="relative w-full">
            <label for="search" class="sr-only">Buscar</label>
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input #searchInput id="search" name="search" class="block w-full pl-10 text-gray-600 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Buscar produtos, categorias..." type="search" autocomplete="off">
          </div>
        </form>
        
        <!-- Painel de Resultados da Busca -->
        @if (isResultsVisible()) {
          <div class="fixed inset-0 z-10" (click)="onResultClick()"></div>
          <div class="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden max-h-96 overflow-y-auto">
            @if(searchResults(); as results) {
              @if (results.products.length === 0 && results.categories.length === 0 && results.stores.length === 0) {
                <p class="px-4 py-3 text-sm text-gray-500">Nenhum resultado encontrado.</p>
              } @else {
                <div class="p-2">
                  @if(results.products.length > 0) {
                    <div class="mb-2">
                      <h3 class="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Produtos</h3>
                      <ul>
                        @for(product of results.products; track product.id) {
                          <li>
                            <a [routerLink]="['/products/edit', product.sku]" (click)="onResultClick()" class="block px-2 py-2 text-sm text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600">{{ product.name }}</a>
                          </li>
                        }
                      </ul>
                    </div>
                  }
                  @if(results.categories.length > 0) {
                    <div class="mb-2">
                      <h3 class="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Categorias</h3>
                      <ul>
                        @for(category of results.categories; track category.id) {
                          <li>
                            <a [routerLink]="['/categories/edit', category.slug]" (click)="onResultClick()" class="block px-2 py-2 text-sm text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600">{{ category.name }}</a>
                          </li>
                        }
                      </ul>
                    </div>
                  }
                  @if(results.stores.length > 0) {
                    <div>
                      <h3 class="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Lojas</h3>
                      <ul>
                        @for(store of results.stores; track store.id) {
                          <li>
                            <a [routerLink]="['/stores/edit', store.id]" (click)="onResultClick()" class="block px-2 py-2 text-sm text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600">{{ store.name }}</a>
                          </li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              }
            }
          </div>
        }
      </div>
    
      <!-- User Menu -->
      <div class="flex items-center space-x-4">
        <button class="text-gray-500 hover:text-gray-700">
          <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        @if (currentUser(); as user) {
          <div class="relative">
            <button (click)="toggleUserMenu()" class="block rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <img class="h-10 w-10 rounded-full object-cover" src="https://picsum.photos/id/1005/100/100" alt="User Avatar">
            </button>
      
            <!-- Dropdown Menu -->
            @if (isUserMenuOpen()) {
              <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                <div class="px-4 py-2 text-sm text-gray-700">
                  <p class="font-semibold">{{ user.email }}</p>
                  <!-- A exibição de 'roles' foi removida para uma UI mais limpa. -->
                </div>
                <div class="border-t border-gray-100"></div>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Meu Perfil</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Configurações</a>
                <div class="border-t border-gray-100"></div>
                <button (click)="logout()" class="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Sair
                </button>
              </div>
            }
          </div>
        }
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
})
export class HeaderComponent {
  // Injeta os serviços necessários.
  searchService = inject(SearchService);
  layoutService = inject(LayoutService);
  authService = inject(AuthService);
  
  // Expõe os signals dos serviços para o template.
  searchResults = this.searchService.results;
  isResultsVisible = this.searchService.isResultsVisible;
  currentUser = this.authService.currentUser;

  // Signal para controlar a visibilidade do menu do usuário.
  isUserMenuOpen = signal(false);

  /**
   * Chamado quando o formulário de busca é enviado.
   * @param term O valor do campo de busca.
   */
  onSearch(term: string): void {
    this.searchService.search(term);
  }

  /**
   * Esconde o painel de resultados. Chamado ao clicar fora ou em um link.
   */
  onResultClick(): void {
    this.searchService.hideResults();
  }

  /**
   * Alterna a visibilidade da sidebar.
   */
  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  /**
   * Alterna a visibilidade do menu do usuário.
   */
  toggleUserMenu(): void {
    this.isUserMenuOpen.update(v => !v);
  }

  /**
   * Realiza o logout do usuário.
   */
  logout(): void {
    this.isUserMenuOpen.set(false); // Garante que o menu feche ao clicar em sair.
    this.authService.logout();
  }
}