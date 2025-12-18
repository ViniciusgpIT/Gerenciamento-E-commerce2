import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { Store } from '../../../models/store.model';

@Component({
  selector: 'app-store-list',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Lojas</h2>
        @if (canManageStores()) {
          <a routerLink="/stores/new" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200">
            Adicionar Loja
          </a>
        }
      </div>
    
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-500">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3">Nome</th>
              <th scope="col" class="px-6 py-3">Tipo</th>
              <th scope="col" class="px-6 py-3">Endereço / Horários</th>
              <th scope="col" class="px-6 py-3">Status</th>
              @if (canManageStores()) {
                <th scope="col" class="px-6 py-3">Ações</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (store of stores(); track store.id) {
              <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{{ store.name }}</td>
                <td class="px-6 py-4">
                  @if(store.type === 'FISICA') {
                    <span>Física</span>
                  } @else {
                    <span>Online</span>
                  }
                </td>
                <td class="px-6 py-4 text-xs">
                  @if(store.fullAddress) { <div>{{ store.fullAddress }}</div> }
                  @if(store.openingHours) { <div>{{ store.openingHours }}</div> }
                </td>
                <td class="px-6 py-4">
                  @if(store.active) {
                    <span class="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Ativa</span>
                  } @else {
                    <span class="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Inativa</span>
                  }
                </td>
                @if (canManageStores()) {
                  <td class="px-6 py-4 flex items-center space-x-3">
                    <a [routerLink]="['/stores/edit', store.id]" class="font-medium text-indigo-600 hover:underline">Editar</a>
                    <button (click)="confirmDelete(store)" class="font-medium text-red-600 hover:underline">Remover</button>
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="canManageStores() ? 5 : 4" class="px-6 py-4 text-center text-gray-500">Nenhuma loja encontrada.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Modal de Confirmação de Exclusão -->
    @if(storeToDelete(); as store) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
          <h3 class="text-lg font-bold text-gray-900">Confirmar Exclusão</h3>
          <p class="mt-2 text-sm text-gray-600">
            Você tem certeza que deseja remover a loja "{{ store.name }}"? Os estoques de produtos nesta loja serão removidos.
          </p>
          <div class="mt-6 flex justify-end space-x-3">
            <button (click)="cancelDelete()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Cancelar
            </button>
            <button (click)="deleteStore()" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
              Remover
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreListComponent {
  storeService = inject(StoreService);
  notificationService = inject(NotificationService);
  authService = inject(AuthService);
  
  stores = this.storeService.stores;
  storeToDelete = signal<Store | null>(null);

  // Signal computado para verificar a permissão de gerenciamento.
  // A verificação agora é se o usuário tem a role 'ADMIN'.
  canManageStores = computed(() => this.authService.hasRole('ADMIN'));

  confirmDelete(store: Store) {
    this.storeToDelete.set(store);
  }

  cancelDelete() {
    this.storeToDelete.set(null);
  }

  deleteStore() {
    const store = this.storeToDelete();
    if (store) {
      this.storeService.delete(store.id).subscribe({
        next: () => {
          this.notificationService.show('Loja removida com sucesso!', 'success');
          this.storeToDelete.set(null);
        },
        error: () => this.notificationService.show('Erro ao remover a loja.', 'error'),
      });
    }
  }
}