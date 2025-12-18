import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Guarda de rota funcional para proteger rotas baseadas em roles (funções) do usuário.
 * @param requiredRole A role necessária para acessar a rota.
 * @returns Uma CanActivateFn que executa a lógica de verificação.
 */
export const roleGuard = (requiredRole: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const notificationService = inject(NotificationService);

    // A lógica de verificação de role foi restaurada para usar o novo método do AuthService.
    if (authService.hasRole(requiredRole)) {
      return true; // Permite o acesso se o usuário tiver a role necessária.
    }

    // Se não tiver a permissão, exibe uma notificação e redireciona para o dashboard.
    notificationService.show('Você não tem permissão para acessar esta página.', 'error');
    router.navigate(['/dashboard']);
    return false;
  };
};