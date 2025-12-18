import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class WrapResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    return next.handle().pipe(
      map((data) => {
        // Se já for uma resposta paginada (tem propriedades como data, total, page, etc.)
        // Não encapsule novamente, apenas adicione timestamp se necessário
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'total' in data
        ) {
          return {
            ...data,
            timestamp: new Date().toISOString(),
          };
        }

        // Para outras respostas, mantenha a estrutura atual
        return {
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
