import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './components/shared/notification/notification.component';

@Component({
  selector: 'app-root',
  template: `
    <!-- O RouterOutlet renderizará o componente de Login ou o MainLayoutComponent, dependendo da rota. -->
    <router-outlet></router-outlet>

    <!-- O NotificationComponent permanece aqui para ser acessível globalmente. -->
    <app-notification></app-notification>
  `,
  // OnPush é uma estratégia de detecção de mudanças que otimiza a performance.
  changeDetection: ChangeDetectionStrategy.OnPush,
  // O componente raiz agora só precisa do RouterOutlet e das Notificações,
  // que devem ser visíveis em todas as telas, incluindo o login.
  imports: [RouterOutlet, NotificationComponent],
})
export class AppComponent {}