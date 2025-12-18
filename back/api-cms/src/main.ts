import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WrapResponseInterceptor } from './common/interceptors/wrapresponse/wrap-response.interceptor';
import { ValidationPipe } from '@nestjs/common/pipes';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose', 'error', 'warn', 'fatal', 'log'],
    bufferLogs: true,
    bodyParser: true,
    cors: true,
    rawBody: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API de Treino')
    .setDescription('BackEnd com Pablito da API')
    .setVersion('1.0')
    .addBearerAuth() // API com login
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalInterceptors(new WrapResponseInterceptor());

  app.enableCors({
    origin: '*', // Para produção, use a URL do seu frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
  });

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
