
import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  message: string;
  type: NotificationType;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  // Signal para manter o estado da notificação atual
  #notification = signal<Notification | null>(null);
  public readonly notification = this.#notification.asReadonly();
  
  private timer: any;

  // Método para mostrar uma notificação.
  // Ele define a notificação e agenda sua remoção após um tempo.
  show(message: string, type: NotificationType = 'success', duration: number = 3000) {
    this.#notification.set({ message, type });
    
    // Limpa qualquer timer anterior para evitar sobreposição
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.hide();
    }, duration);
  }

  // Método para esconder a notificação
  hide() {
    this.#notification.set(null);
    if(this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
    }
  }
}
