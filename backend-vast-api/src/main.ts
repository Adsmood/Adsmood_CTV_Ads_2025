import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Seguridad y optimización
  app.use(helmet());
  app.use(compression());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // límite de 100 peticiones por ventana
    }),
  );
  
  // CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://adsmood-ctv-editor.onrender.com']
      : true
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend VAST API running on port ${port}`);
}
bootstrap(); 