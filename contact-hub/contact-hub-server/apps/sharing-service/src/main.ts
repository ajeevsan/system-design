import { NestFactory } from '@nestjs/core';
import { SharingServiceModule } from './sharing-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(SharingServiceModule);
  const port = Number(process.env.SHARING_SERVICE_PORT ?? 3006);
  await app.listen(port, '0.0.0.0');
}
await bootstrap();
