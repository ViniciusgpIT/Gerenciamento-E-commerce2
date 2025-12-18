import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  // O estado de visibilidade da sidebar é gerenciado por um signal.
  // Inicia como `true` para ser visível por padrão em desktops.
  isSidebarVisible = signal(true);

  // Mostra a sidebar explicitamente.
  showSidebar(): void {
    this.isSidebarVisible.set(true);
  }

  // Esconde a sidebar explicitamente.
  hideSidebar(): void {
    this.isSidebarVisible.set(false);
  }

  // Alterna o estado de visibilidade da sidebar.
  toggleSidebar(): void {
    this.isSidebarVisible.update(visible => !visible);
  }
}
