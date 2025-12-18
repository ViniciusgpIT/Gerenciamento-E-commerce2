import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor funcional para adicionar o token JWT em todas as requisições HTTP.
 * Esta é a forma moderna e recomendada de lidar com interceptors no Angular.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Em um app universal (SSR), window não estaria disponível no servidor.
  // Esta verificação garante que o código só rode no ambiente do navegador.
  if (typeof window === 'undefined') {
    return next(req);
  }
  
  // Pega o token de autenticação que foi salvo no localStorage durante o login.
  const authToken = localStorage.getItem('authToken');

  // Se o token existir, clona a requisição para adicionar o cabeçalho de autorização.
  // O cabeçalho 'Authorization' com o 'Bearer token' é o padrão para autenticação JWT.
  if (authToken) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`),
    });
    // Passa a requisição modificada (com o header) para o próximo handler na cadeia.
    return next(authReq);
  }

  // Se não houver token, a requisição segue sem modificação.
  // Isso é importante para requisições públicas, como a de login.
  return next(req);
};
