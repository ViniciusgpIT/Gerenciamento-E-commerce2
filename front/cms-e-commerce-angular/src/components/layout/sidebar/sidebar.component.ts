import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../services/layout.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  template: `
    <!-- A sidebar agora é um container flex para posicionar o botão de logout no final -->
    <aside class="fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gray-800 text-gray-200 w-64 p-4 transform transition-transform duration-200 ease-in-out z-20 flex flex-col justify-between"
           [class.translate-x-0]="isSidebarVisible()"
           [class.-translate-x-full]="!isSidebarVisible()">
      
      <!-- Navegação principal -->
      <nav class="flex flex-col space-y-1">
        <a routerLink="/dashboard" routerLinkActive="bg-gray-700 text-white" [routerLinkActiveOptions]="{exact: true}"
           class="flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
          <span>Dashboard</span>
        </a>
        <a routerLink="/products" routerLinkActive="bg-gray-700 text-white"
           class="flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" /></svg>
          <span>Produtos</span>
        </a>
        <a routerLink="/categories" routerLinkActive="bg-gray-700 text-white"
           class="flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          <span>Categorias</span>
        </a>
        <a routerLink="/stores" routerLinkActive="bg-gray-700 text-white"
           class="flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v1H8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 001-1v-1h3v1zM12 9a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          <span>Lojas</span>
        </a>
         <a routerLink="/storefront" routerLinkActive="bg-gray-700 text-white"
           class="flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>
          <span>Vitrine</span>
        </a>
        <a routerLink="/audit" routerLinkActive="bg-gray-700 text-white"
           class="flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 10.586V6z" clip-rule="evenodd" />
          </svg>
          <span>Auditoria</span>
        </a>
      </nav>
    
      <!-- Botão de Sair -->
      <div>
        <button (click)="logout()"
                class="flex items-center w-full space-x-3 py-2.5 px-4 rounded transition duration-200 text-red-400 hover:bg-red-800 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sair</span>
        </button>
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
})
export class SidebarComponent {
  // A sidebar agora apenas reage ao estado do serviço de layout.
  layoutService = inject(LayoutService);
  authService = inject(AuthService);
  isSidebarVisible = this.layoutService.isSidebarVisible;

  /**
   * Realiza o logout do usuário.
   */
  logout(): void {
    this.authService.logout();
  }
}