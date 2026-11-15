import { NestFactory } from '@nestjs/core';
import { UploadUsageServiceModule } from './upload-usage-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(UploadUsageServiceModule);
  await app.listen(process.env.port ?? 3000);
}
await bootstrap();
