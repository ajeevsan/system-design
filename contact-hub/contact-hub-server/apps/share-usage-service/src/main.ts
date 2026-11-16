import { NestFactory } from '@nestjs/core';
import { ShareUsageServiceModule } from './share-usage-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(ShareUsageServiceModule);
  const port = Number(process.env.SHARE_USAGE_SERVICE_PORT ?? 3007);
  await app.listen(port, '0.0.0.0');
}
await bootstrap();
