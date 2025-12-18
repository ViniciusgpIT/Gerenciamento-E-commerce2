import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// FIX: Importando FormGroup e FormControl para criar o formulário reativo sem o FormBuilder.
// Esta abordagem é mais explícita e contorna possíveis problemas de injeção de dependência com o FormBuilder.
import { ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  // Componente standalone que importa seus próprios módulos.
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <div class="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-xl">
        <div class="text-center">
           <div class="text-gray-800 flex items-center justify-center space-x-2">
            <svg class="w-10 h-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v11.494m-9-5.747h18"/>
            </svg>
            <span class="text-3xl font-extrabold">CMS Corp</span>
          </div>
          <h2 class="mt-6 text-2xl font-bold text-gray-900">
            Acesse sua conta
          </h2>
        </div>
    
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div class="rounded-md shadow-sm">
            <div>
              <label for="email-address" class="sr-only">Email</label>
              <input id="email-address" name="email" type="email" formControlName="email" required
                     class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                     placeholder="Email">
            </div>
            <div>
              <label for="password" class="sr-only">Senha</label>
              <input id="password" name="password" type="password" formControlName="password" required
                     class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                     placeholder="Senha">
            </div>
          </div>
    
          <div>
            <button type="submit" [disabled]="isLoading()"
                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-wait">
              @if (isLoading()) {
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              } @else {
                Entrar
              }
            </button>
          </div>
        </form>
         <p class="mt-4 text-xs text-center text-gray-500">
            Use <code class="bg-gray-200 text-gray-700 px-1 rounded">admin@cmscorp.com</code> e <code class="bg-gray-200 text-gray-700 px-1 rounded">password123</code> para testar.
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  // Signal para controlar o estado de carregamento do botão de login.
  isLoading = signal(false);

  // Formulário reativo com valores iniciais para facilitar o teste.
  // FIX: O formulário foi reescrito para usar new FormGroup() e new FormControl() diretamente.
  // Isso evita o uso do FormBuilder, que estava causando erros de tipo.
  loginForm = new FormGroup({
    email: new FormControl('admin@cmscorp.com', [Validators.required, Validators.email]),
    password: new FormControl('password123', [Validators.required, Validators.minLength(8)]),
  });

  /**
   * Método chamado ao submeter o formulário.
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.notificationService.show('Por favor, preencha os campos corretamente.', 'error');
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.getRawValue();

    this.authService.login(email!, password!)
      .pipe(
        // `finalize` garante que o estado de loading será desativado,
        // independentemente de sucesso ou falha.
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (success) => {
          // Como o serviço agora retorna 'true' no sucesso, podemos usar isso
          // como uma confirmação para navegar com segurança.
          if (success) {
            this.notificationService.show('Login realizado com sucesso!');
            this.router.navigate(['/dashboard']); // Redireciona para o painel em caso de sucesso.
          }
        },
        error: (err) => {
          // Exibe a mensagem de erro retornada pelo serviço.
          this.notificationService.show(err.message || 'Falha no login.', 'error');
        }
      });
  }
}
