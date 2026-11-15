import { NestFactory } from '@nestjs/core';
import { EtlServiceModule } from './etl-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(EtlServiceModule);

  app.enableShutdownHooks();

  await app.init();

  console.log('ETL worker initialized and listening for jobs');
}
await bootstrap();
