import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true preserves the raw request buffer (needed for the Paystack
  // webhook HMAC signature check).
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Match the FastAPI contract: everything under /api/v1 except /health.
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  // Permissive CORS for dev (mirrors the Python backend in DEBUG).
  app.enableCors();

  const port = process.env.PORT ?? 8001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`QuickGift Node API listening on http://localhost:${port}`);
}
bootstrap();
