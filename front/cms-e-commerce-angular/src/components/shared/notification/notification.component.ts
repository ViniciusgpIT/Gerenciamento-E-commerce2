
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-notification',
  imports: [CommonModule],
  template: `
    @if (notification(); as notification) {
      <div [class]="baseClasses + ' ' + notificationStyles[notification.type]" 
           [class.translate-x-0]="notification"
           [class.translate-x-full]="!notification"
           [class.opacity-100]="notification"
           [class.opacity-0]="!notification"
           role="alert">
    
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="iconPaths[notification.type]" />
        </svg>
        
        <span class="font-medium">{{ notification.message }}</span>
    
        <button (click)="hide()" class="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg focus:ring-2 inline-flex h-8 w-8" [class.hover:bg-green-200]="notification.type === 'success'" [class.hover:bg-red-200]="notification.type === 'error'" [class.hover:bg-blue-200]="notification.type === 'info'">
            <span class="sr-only">Fechar</span>
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </button>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent {
  // Injeta o serviço de notificação para obter o estado atual
  notificationService = inject(NotificationService);
  notification = this.notificationService.notification;

  // Objeto para mapear tipos de notificação para classes do Tailwind
  baseClasses = 'fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 transition-transform transform';
  
  notificationStyles = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  iconPaths = {
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  hide() {
    this.notificationService.hide();
  }
}