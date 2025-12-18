
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';

import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';
import { authInterceptor } from './src/interceptors/auth.interceptor';

// Inicializa a aplicação Angular
// Utilizamos bootstrapApplication para uma abordagem moderna baseada em componentes standalone.
// provideZonelessChangeDetection() habilita o modo zoneless com Signals.
// provideRouter com withHashLocation() é crucial para o ambiente Applet.
bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    // Registra o HttpInterceptor para que ele seja aplicado a todas as chamadas HttpClient.
    // withInterceptors é a função correta para registrar interceptors funcionais.
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.