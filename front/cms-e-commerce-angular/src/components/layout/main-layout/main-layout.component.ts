import { Component, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { NotificationComponent } from '../../shared/notification/notification.component';
import { LayoutService } from '../../../services/layout.service';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { StoreService } from '../../../services/store.service';
import { AuthService } from '../../../services/auth.service';
// FIX: Corrigido o caminho de importação do AuditService.
// O nome correto do arquivo é 'activity-log.service.ts'.
import { AuditService } from '../../../services/activity-log.service';
import { NotificationService as AppNotificationService } from '../../../services/notification.service';
import { forkJoin } from 'rxjs';


@Component({
  selector: 'app-main-layout',
  template: `
    <!-- Esta estrutura é idêntica à que tínhamos no app.component.html -->
    <div class="min-h-screen bg-gray-100 font-sans">
      <!-- Header fixo no topo -->
      <app-header></app-header>
      
      <!-- Sidebar lateral -->
      <app-sidebar></app-sidebar>
      
      <!-- Container principal que se ajusta à sidebar -->
      <div class="pt-16 transition-all duration-200 ease-in-out" [class.md:ml-64]="isSidebarVisible()">
        <main class="p-4 md:p-8">
          <!-- O RouterOutlet aqui renderizará os componentes filhos (Dashboard, Produtos, etc.) -->
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  // Este componente é standalone e importa tudo o que precisa para o layout.
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  // A lógica que antes estava no AppComponent agora reside aqui.
  layoutService = inject(LayoutService);
  isSidebarVisible = this.layoutService.isSidebarVisible;

  // Injeta os serviços de dados para o carregamento inicial.
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private storeService = inject(StoreService);
  private authService = inject(AuthService);
  private auditService = inject(AuditService);
  private notificationService = inject(AppNotificationService);
  
  // Flag para garantir que o carregamento inicial ocorra apenas uma vez.
  private initialDataLoaded = false;

  constructor() {
    // Usamos um 'effect' para reagir a mudanças no estado de autenticação.
    // Esta é a solução para a "race condition" do login.
    effect(() => {
      // O 'effect' será executado sempre que o signal 'isAuthenticated' mudar.
      if (this.authService.isAuthenticated() && !this.initialDataLoaded) {
        // Marcamos como carregado para evitar novas chamadas se o signal mudar por outro motivo.
        this.initialDataLoaded = true;
        this.loadInitialData();
      }
    });
  }

  /**
   * Método que centraliza o carregamento dos dados iniciais.
   * Agora é chamado pelo 'effect' quando o usuário está autenticado.
   */
  private loadInitialData(): void {
    // Usa forkJoin para executar todas as chamadas de carregamento em paralelo.
    forkJoin({
      // Carrega a primeira página de produtos com um limite alto para popular a UI.
      products: this.productService.fetchAll({ page: 1, limit: 100 }),
      // Carrega todas as categorias, incluindo as inativas, para uso em formulários.
      categories: this.categoryService.fetchAll(true),
      // Carrega todas as lojas, incluindo as inativas, para uso em formulários.
      stores: this.storeService.fetchAll(true),
      // Carrega as 10 atividades de auditoria mais recentes para o dashboard.
      auditLogs: this.auditService.getRecentActivity(10),
    }).subscribe({
      error: (err) => {
        console.error('Falha ao carregar dados iniciais:', err);
        this.notificationService.show('Não foi possível carregar os dados do servidor.', 'error');
      }
    });
  }
}