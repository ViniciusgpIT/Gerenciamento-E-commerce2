import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guarda de rota funcional para proteger rotas que exigem autenticação.
 * Usa async/await para esperar a conclusão da verificação inicial de autenticação,
 * resolvendo a condição de corrida ao recarregar a página.
 */
export const authGuard: CanActivateFn = async (route, state): Promise<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Pausa a execução do guarda e espera a Promise do serviço ser resolvida.
  // Isso garante que a verificação do token no construtor do AuthService
  // tenha terminado antes de prosseguirmos.
  await authService.whenAuthReady();

  // Após a espera, o estado de autenticação é definitivo.
  // Agora podemos verificar com segurança se o usuário está logado.
  if (authService.isAuthenticated()) {
    return true; // Permite o acesso.
  }

  // Se não estiver autenticado, cria uma UrlTree para redirecionar para a página de login.
  // Esta é a forma recomendada de fazer redirecionamentos dentro de guardas.
  return router.createUrlTree(['/login']);
};