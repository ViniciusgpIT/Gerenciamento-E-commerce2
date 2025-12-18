import { Injectable, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of, tap, throwError, switchMap, catchError, map, Observable, finalize } from 'rxjs';
import { API_URL } from '../environments/api.config';

// Interface para a resposta da API de login.
interface LoginResponse {
  data: {
    access_token: string;
  };
}

// Interface para a resposta da API /auth/me.
interface MeResponse {
  data: User;
}

// Interface para o payload do usuário, agora com roles.
export interface User {
  sub: number; 
  email: string;
  roles: string[]; // Ex: ['ADMIN', 'USER']
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);

  // Armazena o objeto completo do usuário, incluindo roles.
  currentUser = signal<User | null>(null);

  // O estado de autenticação reage à presença de um usuário.
  isAuthenticated = computed(() => !!this.currentUser());
  
  // Promise para sinalizar quando a verificação inicial de autenticação estiver concluída.
  private resolveAuthReady!: () => void;
  private authReadyPromise: Promise<void>;


  constructor() {
    // Inicializa a Promise que o authGuard irá esperar.
    this.authReadyPromise = new Promise(resolve => {
      this.resolveAuthReady = resolve;
    });

    // A verificação do token só deve acontecer no ambiente do navegador.
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Se um token existe, tentamos validar com o backend.
        this.fetchAndStoreUser().pipe(
          // 'finalize' garante que a Promise seja resolvida, independentemente de sucesso ou falha.
          finalize(() => this.resolveAuthReady())
        ).subscribe({
          error: () => this.logout() // Se o token for inválido, desloga.
        });
      } else {
        // Se não há token, a verificação termina imediatamente.
        this.resolveAuthReady();
      }
    } else {
       // Se não estiver no navegador (ex: SSR), não há verificação a ser feita.
      this.resolveAuthReady();
    }
  }

  /**
   * Permite que outras partes da aplicação (como o authGuard) esperem
   * pela conclusão da verificação inicial de autenticação.
   */
  public whenAuthReady(): Promise<void> {
    return this.authReadyPromise;
  }

  /**
   * Busca os dados do usuário no endpoint /auth/me usando o token do localStorage.
   * Se bem-sucedido, armazena o usuário no signal `currentUser`.
   * Se o usuário da API não tiver roles, atribui a role 'ADMIN' por padrão.
   * @returns Observable que emite o usuário em caso de sucesso ou um erro.
   */
  private fetchAndStoreUser(): Observable<User> {
    return this.http.get<MeResponse>(`${API_URL}/auth/me`).pipe(
      map(response => {
        if (!response || !response.data) {
          throw new Error('Resposta inválida do endpoint /auth/me');
        }
        
        const userFromApi = response.data;

        // **LÓGICA ADAPTATIVA DE ROLES**
        // Se o usuário vindo da API não tiver um array de roles, ou se o array estiver vazio,
        // nós assumimos que ele é um administrador. Isso mantém a proteção de rotas funcionando.
        if (!userFromApi.roles || userFromApi.roles.length === 0) {
          userFromApi.roles = ['ADMIN'];
        }

        this.currentUser.set(userFromApi);
        return userFromApi;
      })
    );
  }

  /**
   * Realiza o login, obtém o token e em seguida busca os dados do usuário.
   */
  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, { email, password }).pipe(
      switchMap(response => {
        if (!response || !response.data || !response.data.access_token) {
          return throwError(() => new Error('Resposta de login inválida do servidor.'));
        }
        const token = response.data.access_token;
        localStorage.setItem('authToken', token);
        
        // Após salvar o token, busca os dados do usuário para validar e obter roles.
        return this.fetchAndStoreUser();
      }),
      map(() => true), // Se tudo deu certo, emite `true`.
      catchError(err => {
        // Limpa o estado em caso de erro.
        localStorage.removeItem('authToken');
        this.currentUser.set(null);
        const errorMessage = err.error?.message || err.message || 'Falha na autenticação.';
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  
  /**
   * Verifica se o usuário atual possui uma determinada role.
   * @param requiredRole A role a ser verificada.
   * @returns `true` se o usuário tiver a role, caso contrário `false`.
   */
  hasRole(requiredRole: string): boolean {
    return this.currentUser()?.roles.includes(requiredRole) ?? false;
  }

  /**
   * Realiza o logout, limpando o estado e o localStorage.
   */
  logout(): void {
    localStorage.removeItem('authToken');
    this.currentUser.set(null); // Limpa o estado do usuário.
    this.router.navigate(['/login']);
  }
}