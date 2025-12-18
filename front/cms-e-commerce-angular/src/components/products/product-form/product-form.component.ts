

import { Component, ChangeDetectionStrategy, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
// FIX: Removido FormBuilder e adicionado FormGroup, FormControl explicitamente.
// Optamos por instanciar as classes de formulário diretamente para evitar
// um problema onde a injeção de dependência do FormBuilder não estava funcionando como esperado.
import { ReactiveFormsModule, Validators, FormArray, AbstractControl, ValidationErrors, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { StoreService } from '../../../services/store.service';
import { NotificationService } from '../../../services/notification.service';
import { Product } from '../../../models/product.model';
import { StockByStore } from '../../../models/store.model';
import { take } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        {{ isEditMode ? 'Editar Produto' : 'Novo Produto' }}
      </h2>
    
      <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="space-y-6">
        <!-- Campos Principais -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Nome do Produto</label>
            <input type="text" id="name" formControlName="name" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          </div>
          <div>
            <label for="sku" class="block text-sm font-medium text-gray-700">SKU</label>
            <input type="text" id="sku" formControlName="sku" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          </div>
        </div>
        
        <div>
          <label for="detailedDescription" class="block text-sm font-medium text-gray-700">Descrição Detalhada</label>
          <textarea id="detailedDescription" formControlName="detailedDescription" rows="4" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>
        
        <!-- Preços e Categoria -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label for="price" class="block text-sm font-medium text-gray-700">Preço</label>
            <input type="number" id="price" formControlName="price" placeholder="199.90" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          </div>
          <div>
            <label for="promotionalPrice" class="block text-sm font-medium text-gray-700">Preço Promocional (Opcional)</label>
            <input type="number" id="promotionalPrice" formControlName="promotionalPrice" placeholder="149.90" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          </div>
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700">Categoria</label>
            <select id="category" formControlName="categoryId" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option [ngValue]="null" disabled>Selecione uma categoria ativa</option>
              @for(category of activeCategories(); track category.id) {
                <option [ngValue]="category.id">{{ category.name }}</option>
              }
            </select>
          </div>
        </div>
    
        <!-- Variações -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="sizes" class="block text-sm font-medium text-gray-700">Tamanhos (separados por vírgula)</label>
            <input type="text" id="sizes" formControlName="sizes" placeholder="P, M, G, GG" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          </div>
          <div>
            <label for="colors" class="block text-sm font-medium text-gray-700">Cores (separadas por vírgula)</label>
            <input type="text" id="colors" formControlName="colors" placeholder="Preto, Branco, Azul" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          </div>
        </div>
    
        <!-- Seção de Imagens com Pré-visualização -->
        <div formArrayName="images" class="pt-4 border-t">
          <label class="block text-sm font-medium text-gray-700 mb-2">Imagens do Produto (mín 1, máx 8)</label>
          @for (imageControl of images.controls; track $index) {
            <div class="flex items-start space-x-4 mb-3">
              <!-- Pré-visualização da Imagem -->
              <div class="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center border">
                @if(imageControl.value) {
                  <img [src]="imageControl.value" alt="Prévia da imagem" class="w-full h-full object-cover rounded-md" (error)="$event.target.style.display='none'">
                } @else {
                  <svg class="w-8 h-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              </div>
              <!-- Campo de Input e Botão de Remover -->
              <div class="flex-grow">
                <input [formControlName]="$index" placeholder="https://exemplo.com/imagem.jpg" class="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                <button type="button" (click)="removeImage($index)" class="mt-1 text-red-600 hover:text-red-800 p-1 font-medium text-xs">REMOVER</button>
              </div>
            </div>
          }
          @if (images.length < 8) {
              <button type="button" (click)="addImage()" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Adicionar Imagem</button>
          }
        </div>
    
        <!-- Seção de Estoque -->
        <div class="pt-4 border-t" formArrayName="stocks">
            <label class="block text-sm font-medium text-gray-700 mb-2">Estoque por Loja</label>
            <div class="space-y-3">
              @for(stockControl of stocks.controls; track $index) {
                <div [formGroupName]="$index" class="grid grid-cols-3 gap-3 items-center p-2 bg-gray-50 rounded-md">
                    <span class="text-sm font-medium text-gray-800 col-span-1">{{ storeNameMap().get(stockControl.value.storeId) }}</span>
                    <div class="col-span-1">
                        <label [for]="'quantity-' + $index" class="sr-only">Quantidade</label>
                        <input [id]="'quantity-' + $index" type="number" formControlName="quantity" class="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                    </div>
                    <div class="col-span-1 text-right">
                        <button type="button" (click)="removeStock($index)" class="text-red-600 hover:text-red-800 p-1 font-medium text-xs">REMOVER</button>
                    </div>
                </div>
              }
              @if (stocks.controls.length === 0) {
                <p class="text-sm text-gray-500">Nenhum estoque cadastrado para este produto.</p>
              }
            </div>
    
            <!-- Formulário para Adicionar Estoque -->
            <div class="mt-6 pt-4 border-t border-dashed" [formGroup]="newStockForm">
                <p class="text-sm font-medium text-gray-700 mb-2">Adicionar Novo Estoque</p>
                <div class="grid grid-cols-3 gap-4 items-center">
                    <div class="col-span-1">
                        <label for="newStockStore" class="sr-only">Loja</label>
                        <select id="newStockStore" formControlName="storeId" class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option [ngValue]="null" disabled>Selecione a loja</option>
                            @for(store of availableStoresForStock(); track store.id) {
                                <option [ngValue]="store.id">{{ store.name }}</option>
                            }
                        </select>
                    </div>
                    <div class="col-span-1">
                        <label for="newStockQuantity" class="sr-only">Quantidade</label>
                        <input id="newStockQuantity" type="number" formControlName="quantity" class="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                    </div>
                    <div class="col-span-1">
                        <button type="button" (click)="addStock()" [disabled]="newStockForm.invalid" class="w-full bg-gray-600 text-white px-3 py-2 text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-700 disabled:bg-gray-300">
                          Adicionar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    
    
        <!-- Campo Status -->
        <div class="flex items-center pt-4 border-t">
          <input id="active" type="checkbox" formControlName="active" class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
          <label for="active" class="ml-2 block text-sm text-gray-900">Ativo</label>
        </div>
        @if (productForm.hasError('inactiveWithMissingFields')) {
            <p class="text-sm text-red-600 mt-1">Para ativar, o produto precisa de ao menos 1 imagem e 1 categoria.</p>
        }
    
        <!-- Botões de Ação -->
        <div class="flex justify-end space-x-4 pt-4 mt-8">
          <button type="button" (click)="goBack()" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition duration-200">
            Cancelar
          </button>
          <button type="submit" [disabled]="productForm.invalid" class="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed">
            Salvar
          </button>
        </div>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private storeService = inject(StoreService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Usa o signal de categorias ativas para o dropdown.
  allStores = this.storeService.stores;
  activeCategories = this.categoryService.activeCategories;
  productId: number | null = null;
  isEditMode = false;
  
  // Mapa para consulta rápida do nome da loja pelo ID
  storeNameMap = computed(() => {
    const map = new Map<number, string>();
    this.allStores().forEach(store => map.set(store.id, store.name));
    return map;
  });

  // FIX: Formulário principal reescrito com `new FormGroup` para resolver erros de tipo.
  productForm = new FormGroup({
    name: new FormControl('', Validators.required),
    detailedDescription: new FormControl(''),
    sku: new FormControl('', Validators.required),
    eanUpc: new FormControl(''),
    price: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    promotionalPrice: new FormControl<number | null>(null),
    categoryId: new FormControl<number | null>(null, Validators.required),
    sizes: new FormControl(''),
    colors: new FormControl(''),
    images: new FormArray<FormControl<string | null>>([], [Validators.required, Validators.minLength(1)]),
    stocks: new FormArray<FormGroup<{storeId: FormControl<number | null>, quantity: FormControl<number | null>}>>([]),
    active: new FormControl(true),
  }, { validators: this.productActivationValidator });

  // FIX: Formulário de estoque reescrito com `new FormGroup` para manter a consistência.
  newStockForm = new FormGroup({
    storeId: new FormControl<number | null>(null, Validators.required),
    quantity: new FormControl(0, [Validators.required, Validators.min(0)])
  });

  // Signal que observa as mudanças no FormArray de estoque.
  private stockValueSignal = toSignal(this.productForm.get('stocks')!.valueChanges, {initialValue: [] as { storeId: number | null; quantity: number | null }[]});

  // Signal computado para filtrar lojas que ainda não têm estoque neste produto.
  availableStoresForStock = computed(() => {
    const assignedStoreIds = this.stockValueSignal().map(s => s.storeId);
    return this.allStores().filter(store => !assignedStoreIds.includes(store.id));
  });

  get images(): FormArray {
    return this.productForm.get('images') as FormArray;
  }
  get stocks(): FormArray {
    return this.productForm.get('stocks') as FormArray;
  }

  ngOnInit(): void {
    const sku = this.route.snapshot.paramMap.get('sku');
    if (sku) {
      this.isEditMode = true;
      this.productService.getBySku(sku).pipe(take(1)).subscribe(product => {
        if (product) {
          this.productId = product.id; // Armazena o ID para a chamada de update
          this.productForm.patchValue({
            ...product,
            sizes: product.sizes.join(', '),
            colors: product.colors.join(', '),
          });
          // FIX: Utiliza `new FormControl` para adicionar controles ao FormArray.
          this.images.clear(); // Limpa o array antes de popular
          product.images.forEach(url => this.images.push(new FormControl(url, Validators.required)));
          this.stocks.clear(); // Limpa o array antes de popular
          product.stocks.forEach(stockItem => this.addStockToForm(stockItem));
          
          this.productForm.markAsPristine(); // Marca o form como "limpo" após carregar os dados
        }
      });
    }
  }

  // Adiciona um grupo de controle de estoque ao FormArray.
  private addStockToForm(stockItem: StockByStore): void {
    // FIX: Utiliza `new FormGroup` e `new FormControl` para criar o grupo de estoque.
    const stockGroup = new FormGroup({
      storeId: new FormControl(stockItem.storeId, Validators.required),
      quantity: new FormControl(stockItem.quantity, [Validators.required, Validators.min(0)])
    });
    this.stocks.push(stockGroup);
  }
  
  // Adiciona um novo item de estoque com base no formulário 'newStockForm'.
  addStock(): void {
    if (this.newStockForm.valid) {
      this.addStockToForm(this.newStockForm.getRawValue() as StockByStore);
      this.newStockForm.reset({ storeId: null, quantity: 0 });
      // FIX: Marca o FormArray de estoques como 'dirty' explicitamente.
      // Isso garante que a lógica de salvamento detecte a alteração estrutural
      // e que o estado 'dirty' se propague para o formulário pai.
      this.stocks.markAsDirty();
    }
  }

  // Remove um item de estoque do FormArray pelo índice.
  removeStock(index: number): void {
    this.stocks.removeAt(index);
    // FIX: Marca o FormArray de estoques como 'dirty' explicitamente.
    // Isso garante que, ao remover um item, a alteração seja detectada
    // pela lógica de salvamento que verifica o estado 'dirty'.
    this.stocks.markAsDirty();
  }

  addImage() {
    if (this.images.length < 8) {
      // FIX: Utiliza `new FormControl` para adicionar um novo campo de imagem.
      const imageControl = new FormControl('', Validators.required);
      this.images.push(imageControl);
      this.images.markAsDirty();
    }
  }

  removeImage(index: number) {
    this.images.removeAt(index);
    this.images.markAsDirty();
  }

  // Validador customizado para a regra de negócio de ativação.
  productActivationValidator(control: AbstractControl): ValidationErrors | null {
    const active = control.get('active')?.value;
    const categoryId = control.get('categoryId')?.value;
    const images = control.get('images') as FormArray;
    if (active && (!categoryId || images.length === 0)) {
      return { inactiveWithMissingFields: true };
    }
    return null;
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      let message = 'Por favor, preencha todos os campos obrigatórios.';
      if (this.productForm.hasError('inactiveWithMissingFields')) {
          message = 'Para ativar um produto, é necessário ter ao menos uma imagem e uma categoria selecionada.'
      }
      this.notificationService.show(message, 'error');
      this.productForm.markAllAsTouched();
      return;
    }
    
    // Define o tipo da operação (Observable) que será executada.
    let operation;

    if (this.isEditMode) {
      // MODO DE EDIÇÃO: Envia apenas os campos que foram alterados.
      if (!this.productForm.dirty) {
        this.notificationService.show('Nenhuma alteração foi feita.', 'info');
        return;
      }

      const updatePayload: Partial<Product> = {};
      const controls = this.productForm.controls;

      // Itera sobre os controles do formulário para encontrar os que foram modificados ("dirty").
      Object.keys(controls).forEach(keyStr => {
        const key = keyStr as keyof typeof controls;
        const control = controls[key];
        
        if (control.dirty) {
          // Aplica as transformações necessárias para cada campo antes de adicionar ao payload.
          switch(key) {
            case 'price':
              (updatePayload as any)[key] = Number(control.value);
              break;
            case 'promotionalPrice':
              (updatePayload as any)[key] = control.value ? Number(control.value) : null;
              break;
            case 'categoryId':
              (updatePayload as any)[key] = Number(control.value);
              break;
            case 'sizes':
            case 'colors':
               (updatePayload as any)[key] = (control.value as string)?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
               break;
            case 'images':
              // Para 'images', pegamos o valor completo do FormArray
              updatePayload.images = this.images.getRawValue().filter(Boolean) as string[];
              break;
            case 'stocks':
               // Para 'stocks', pegamos o valor completo e transformamos os tipos
               updatePayload.stocks = this.stocks.getRawValue().map(s => ({
                   storeId: Number(s.storeId),
                   quantity: Number(s.quantity)
               }));
               break;
            default:
              // Para campos simples, apenas atribuímos o valor.
              (updatePayload as any)[key] = control.value;
              break;
          }
        }
      });
      operation = this.productService.update(this.productId!, updatePayload);

    } else {
      // MODO DE CRIAÇÃO: Envia o objeto completo.
      const formValue = this.productForm.getRawValue();
      const productData = {
          ...formValue,
          price: Number(formValue.price),
          promotionalPrice: formValue.promotionalPrice ? Number(formValue.promotionalPrice) : null,
          categoryId: Number(formValue.categoryId),
          sizes: formValue.sizes?.split(',').map(s => s.trim()).filter(Boolean) ?? [],
          colors: formValue.colors?.split(',').map(c => c.trim()).filter(Boolean) ?? [],
          stocks: formValue.stocks?.map((s) => ({
              storeId: Number(s.storeId),
              quantity: Number(s.quantity)
          })) ?? []
      } as Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'>;
      operation = this.productService.add(productData);
    }
    
    // Executa a operação (criar ou atualizar) e lida com a resposta.
    operation.pipe(take(1)).subscribe({
      next: () => {
        this.notificationService.show(`Produto ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.notificationService.show(`Erro ao salvar o produto: ${err.message}`, 'error');
      }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/products']);
  }
}