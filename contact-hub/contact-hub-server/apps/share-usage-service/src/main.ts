import { NestFactory } from '@nestjs/core';
import { ShareUsageServiceModule } from './share-usage-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(ShareUsageServiceModule);
  await app.listen(process.env.port ?? 3000);
}
await bootstrap();
