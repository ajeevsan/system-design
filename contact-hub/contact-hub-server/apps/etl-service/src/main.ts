import { NestFactory } from '@nestjs/core';
import { EtlServiceModule } from './etl-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(EtlServiceModule);
  await app.listen(process.env.port ?? 3000);
}
await bootstrap();
