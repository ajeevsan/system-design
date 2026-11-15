import { NestFactory } from '@nestjs/core';
import { UploadServiceModule } from './upload-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(UploadServiceModule, {
    bodyParser: false,
  });

  const port = Number(process.env.UPLOAD_SERVICE_PORT ?? 3003);

  await app.listen(port, '127.0.0.1');

  console.log(`Upload Service is running on port ${port}`);
}
await bootstrap();
