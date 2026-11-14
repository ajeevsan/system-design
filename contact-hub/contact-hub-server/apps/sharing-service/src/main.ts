import { NestFactory } from '@nestjs/core';
import { SharingServiceModule } from './sharing-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(SharingServiceModule);
  await app.listen(process.env.port ?? 3000);
}
await bootstrap();
