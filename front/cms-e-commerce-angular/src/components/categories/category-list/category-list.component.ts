import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-category-list',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Categorias</h2>
        @if(canManageCategories()) {
          <a routerLink="/categories/new" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200">
            Adicionar Categoria
          </a>
        }
      </div>
    
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-500">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3">Nome</th>
              <th scope="col" class="px-6 py-3">Descrição</th>
              <th scope="col" class="px-6 py-3">Status</th>
              @if(canManageCategories()) {
                <th scope="col" class="px-6 py-3">Ações</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (category of categories(); track category.id) {
              <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{{ category.name }}</td>
                <td class="px-6 py-4">{{ category.description }}</td>
                <td class="px-6 py-4">
                  @if(category.active) {
                    <span class="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Ativa</span>
                  } @else {
                    <span class="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Inativa</span>
                  }
                </td>
                @if(canManageCategories()) {
                  <td class="px-6 py-4 flex items-center space-x-3">
                    <a [routerLink]="['/categories/edit', category.slug]" class="font-medium text-indigo-600 hover:underline">Editar</a>
                    <button (click)="confirmDelete(category)" class="font-medium text-red-600 hover:underline">Remover</button>
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="canManageCategories() ? 4 : 3" class="px-6 py-4 text-center text-gray-500">Nenhuma categoria encontrada.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Modal de Confirmação de Exclusão -->
    @if(categoryToDelete(); as category) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
          <h3 class="text-lg font-bold text-gray-900">Confirmar Exclusão</h3>
          <p class="mt-2 text-sm text-gray-600">
            Você tem certeza que deseja remover a categoria "{{ category.name }}"?
          </p>
          <div class="mt-6 flex justify-end space-x-3">
            <button (click)="cancelDelete()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Cancelar
            </button>
            <button (click)="deleteCategory()" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
              Remover
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListComponent {
  categoryService = inject(CategoryService);
  notificationService = inject(NotificationService);
  authService = inject(AuthService);

  categories = this.categoryService.categories;
  categoryToDelete = signal<Category | null>(null);

  // Signal computado para verificar a permissão de gerenciamento.
  // A verificação agora é se o usuário tem a role 'ADMIN'.
  canManageCategories = computed(() => this.authService.hasRole('ADMIN'));

  confirmDelete(category: Category) {
    this.categoryToDelete.set(category);
  }

  cancelDelete() {
    this.categoryToDelete.set(null);
  }

  deleteCategory() {
    const category = this.categoryToDelete();
    if (category) {
      this.categoryService.delete(category.id).subscribe({
        next: () => {
          this.notificationService.show('Categoria removida com sucesso!', 'success');
          this.categoryToDelete.set(null);
        },
        error: () => this.notificationService.show('Erro ao remover a categoria.', 'error'),
      });
    }
  }
}