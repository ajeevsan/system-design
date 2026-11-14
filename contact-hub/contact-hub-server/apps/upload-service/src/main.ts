import { NestFactory } from '@nestjs/core';
import { UploadServiceModule } from './upload-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(UploadServiceModule);
  await app.listen(process.env.port ?? 3000);
}
await bootstrap();
