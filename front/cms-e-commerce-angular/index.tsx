import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideZonelessChangeDetection, LOCALE_ID, DEFAULT_CURRENCY_CODE } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';
import { authInterceptor } from './src/interceptors/auth.interceptor';

// Registra os dados de localidade para pt-BR.
// Isso é necessário para que pipes como `date` e `currency` funcionem corretamente.
registerLocaleData(localePt);

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
    // Define o LOCALE_ID para 'pt-BR', garantindo a formatação correta de datas e moedas.
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    // Define o código da moeda padrão como 'BRL' (Real Brasileiro).
    // O pipe `currency` usará 'R$' como símbolo padrão agora.
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.