import { NestFactory } from '@nestjs/core';
import { ContactServiceModule } from './contact-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(ContactServiceModule);
  await app.listen(process.env.port ?? 3000);
}
await bootstrap();
