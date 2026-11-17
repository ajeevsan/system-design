import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(UserServiceModule);

  const port = Number(process.env.USER_SERVICE_PORT ?? 3002);

  await app.listen(port, '127.0.0.1');

  console.log(`User service is running on port ${port}`);
}
await bootstrap();

