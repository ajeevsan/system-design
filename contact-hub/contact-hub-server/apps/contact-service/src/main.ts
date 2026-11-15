import { NestFactory } from '@nestjs/core';
import { ContactServiceModule } from './contact-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(ContactServiceModule);
  const port = Number(process.env.PORT ?? 3005);
  await app.listen(port, '0.0.0.0');
}
await bootstrap();
