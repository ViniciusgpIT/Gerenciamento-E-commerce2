import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// FIX: Removido FormBuilder e adicionado FormGroup, FormControl explicitamente para evitar problemas com a injeção de dependência.
import { ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { NotificationService } from '../../../services/notification.service';
import { take } from 'rxjs';
import { Store } from '../../../models/store.model';

@Component({
  selector: 'app-store-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        {{ isEditMode ? 'Editar Loja' : 'Nova Loja' }}
      </h2>
    
      <form [formGroup]="storeForm" (ngSubmit)="saveStore()" class="space-y-6">
        <!-- Campo Nome -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Nome da Loja</label>
          <input type="text" id="name" formControlName="name" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
        </div>
    
        <!-- Campo Tipo -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Tipo de Loja</label>
          <select formControlName="type" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            <option value="FISICA">Física</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
    
        <!-- Campos para Loja Física -->
        @if(storeForm.get('type')?.value === 'FISICA') {
          <div class="space-y-6">
            <div>
                <label for="fullAddress" class="block text-sm font-medium text-gray-700">Endereço Completo</label>
                <input type="text" id="fullAddress" formControlName="fullAddress" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            </div>
            <div>
                <label for="openingHours" class="block text-sm font-medium text-gray-700">Horário de Funcionamento</label>
                <input type="text" id="openingHours" formControlName="openingHours" placeholder="ex: 10h às 22h" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            </div>
          </div>
        }
        
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
          <button type="submit" [disabled]="storeForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed">
            Salvar
          </button>
        </div>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreFormComponent implements OnInit {
  private storeService = inject(StoreService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  storeId: number | null = null;
  isEditMode = false;

  // FIX: Formulário reescrito com `new FormGroup` para resolver erro de tipo.
  storeForm = new FormGroup({
    name: new FormControl('', Validators.required),
    type: new FormControl<'FISICA' | 'ONLINE'>('FISICA', Validators.required),
    fullAddress: new FormControl<string | null>(null),
    openingHours: new FormControl<string | null>(null),
    active: new FormControl(true),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.storeId = +id;
      this.storeService.getById(this.storeId).pipe(take(1)).subscribe(store => {
        if (store) {
          this.storeForm.patchValue(store);
        }
      });
    }

    // Limpa os campos de endereço se o tipo for online
    this.storeForm.get('type')?.valueChanges.subscribe(type => {
      if (type === 'ONLINE') {
        this.storeForm.get('fullAddress')?.reset();
        this.storeForm.get('openingHours')?.reset();
      }
    });
  }

  saveStore(): void {
    if (this.storeForm.invalid) {
      this.notificationService.show('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const formValue = this.storeForm.getRawValue();
    
    const operation = this.isEditMode
      ? this.storeService.update({ ...formValue, id: this.storeId! })
      : this.storeService.add(formValue as Omit<Store, 'id' | 'createdAt' | 'updatedAt'>);

    operation.pipe(take(1)).subscribe({
      next: () => {
        this.notificationService.show(`Loja ${this.isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
        this.router.navigate(['/stores']);
      },
      error: (err) => {
        this.notificationService.show(`Erro ao salvar a loja.`, 'error');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/stores']);
  }
}
