import { Component, ChangeDetectionStrategy, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// FIX: Removido FormBuilder e adicionado FormGroup, FormControl explicitamente.
// Esta abordagem direta evita a injeção de dependência do FormBuilder, que estava causando problemas de tipo.
import { ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { NotificationService } from '../../../services/notification.service';
import { take } from 'rxjs';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-category-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        {{ isEditMode ? 'Editar Categoria' : 'Nova Categoria' }}
      </h2>
    
      <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Campo Nome -->
            <div>
                <label for="name" class="block text-sm font-medium text-gray-700">Nome da Categoria</label>
                <input type="text" id="name" formControlName="name" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            </div>
    
            <!-- Campo Slug -->
            <div>
                <label for="slug" class="block text-sm font-medium text-gray-700">Slug (para URL)</label>
                <input type="text" id="slug" formControlName="slug" placeholder="nome-da-categoria" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            </div>
        </div>
    
        <!-- Campo Descrição -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea id="description" formControlName="description" rows="3" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>
    
        <!-- Campo Categoria Pai -->
        <div>
            <label for="parentId" class="block text-sm font-medium text-gray-700">Categoria Pai (Opcional)</label>
            <select id="parentId" formControlName="parentId" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option [ngValue]="null">Nenhuma</option>
              @for(category of availableParentCategories(); track category.id) {
                <option [ngValue]="category.id">{{ category.name }}</option>
              }
            </select>
        </div>
    
        <!-- Campo Status -->
        <div class="flex items-center">
          <input id="active" type="checkbox" formControlName="active" class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
          <label for="active" class="ml-2 block text-sm text-gray-900">Ativa</label>
        </div>
    
        <!-- Botões de Ação -->
        <div class="flex justify-end space-x-4 pt-4">
          <button type="button" (click)="goBack()" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition duration-200">
            Cancelar
          </button>
          <button type="submit" [disabled]="categoryForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed">
            Salvar
          </button>
        </div>
      </form>
    </div>

    <!-- Modal de Confirmação de Inativação -->
    @if(showInactivationConfirm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 class="text-lg font-bold text-gray-900">Confirmar Inativação</h3>
          <p class="mt-4 text-sm text-gray-600">
            Ao inativar esta categoria, todos os produtos diretamente associados a ela (e a suas subcategorias) serão movidos para a categoria padrão "Sem Categoria".
          </p>
          <p class="mt-2 text-sm text-gray-600 font-semibold">
            Você tem certeza que deseja continuar?
          </p>
          <div class="mt-6 flex justify-end space-x-3">
            <button (click)="cancelInactivation()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Cancelar
            </button>
            <button (click)="confirmInactivation()" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
              Sim, Inativar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  categoryId: number | null = null;
  isEditMode = false;

  // Signals para controlar o modal de confirmação
  showInactivationConfirm = signal(false);
  private pendingUpdatePayload = signal<Partial<Category> | null>(null);

  // Signal para popular o dropdown de categoria pai, excluindo a própria categoria
  availableParentCategories = computed(() => {
    if (!this.isEditMode) return this.categoryService.categories();
    return this.categoryService.categories().filter(c => c.id !== this.categoryId);
  });
  
  // FIX: Formulário reescrito com `new FormGroup` para resolver erro de tipo.
  categoryForm = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    slug: new FormControl('', Validators.required),
    parentId: new FormControl<number | null>(null),
    active: new FormControl(true),
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.isEditMode = true;
      this.categoryService.getBySlug(slug).pipe(take(1)).subscribe(category => {
        if (category) {
          this.categoryId = category.id; // Armazena o ID para a chamada de update
          this.categoryForm.patchValue(category);
          // Marca o formulário como "limpo" após carregar os dados.
          // Isso é importante para a lógica de 'dirty' que detecta a inativação.
          this.categoryForm.markAsPristine();
        }
      });
    }
  }
  
  /**
   * Constrói um payload para atualização contendo apenas os campos que foram modificados.
   * Esta é a prática recomendada para requisições PATCH, evitando o envio de dados
   * desnecessários ou que possam falhar na validação do backend.
   */
  private buildUpdatePayload(): Partial<Category> {
    const payload: Partial<Category> = {};
    const controls = this.categoryForm.controls;

    // Itera sobre cada controle do formulário
    Object.keys(controls).forEach(keyStr => {
        const key = keyStr as keyof typeof controls;
        const control = controls[key];
        
        // Adiciona ao payload apenas se o campo foi modificado pelo usuário
        if (control.dirty) {
            // Tratamento especial para parentId, garantindo que seja número ou nulo.
            if (key === 'parentId') {
                (payload as any)[key] = control.value ? Number(control.value) : null;
            } else {
                (payload as any)[key] = control.value;
            }
        }
    });
    return payload;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.notificationService.show('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    // No modo de edição, se nenhum campo foi alterado, notifica o usuário e para a execução.
    if (this.isEditMode && !this.categoryForm.dirty) {
        this.notificationService.show('Nenhuma alteração foi feita.', 'info');
        return;
    }

    let payload: any;
    if (this.isEditMode) {
        // Para edição, construímos o payload apenas com os dados alterados.
        payload = this.buildUpdatePayload();
    } else {
        // Para criação, usamos o valor completo do formulário.
        const formValue = this.categoryForm.getRawValue();
        payload = { ...formValue, parentId: formValue.parentId ? Number(formValue.parentId) : null };
    }

    // Verifica se a ação é uma desativação (apenas em modo de edição e se o campo 'active' foi alterado para false).
    const isDeactivating = this.isEditMode && payload.hasOwnProperty('active') && payload.active === false;

    if (isDeactivating) {
      // Se for desativação, guarda o payload e abre o modal de confirmação.
      this.pendingUpdatePayload.set(payload);
      this.showInactivationConfirm.set(true);
    } else {
      // Caso contrário, prossegue com a operação de salvar (criar ou editar).
      this.proceedWithSave(payload);
    }
  }

  // Método que executa a chamada ao serviço
  private proceedWithSave(payload: any): void {
    const operation = this.isEditMode
      ? this.categoryService.update({ ...payload, id: this.categoryId! })
      : this.categoryService.add(payload);

    operation.pipe(take(1)).subscribe({
      next: () => {
        this.notificationService.show(`Categoria ${this.isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
        this.router.navigate(['/categories']);
      },
      error: (err) => {
        // Exibe a mensagem de erro específica do backend, se houver.
        const message = err.error?.message ? `Erro: ${err.error.message}` : 'Erro ao salvar a categoria.';
        this.notificationService.show(message, 'error');
        console.error('Falha ao salvar categoria:', err);
      }
    });
  }

  // Ação do modal: o usuário confirmou a inativação
  confirmInactivation(): void {
    const payload = this.pendingUpdatePayload();
    if (payload) {
      this.proceedWithSave(payload);
    }
    this.cancelInactivation(); // Fecha o modal e limpa o estado
  }

  // Ação do modal: o usuário cancelou a inativação
  cancelInactivation(): void {
    this.showInactivationConfirm.set(false);
    this.pendingUpdatePayload.set(null);
  }

  goBack(): void {
    this.router.navigate(['/categories']);
  }
}