import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module.js';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  app.enableCors({
    origin: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.use(
    '/api/users',
    createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
      pathRewrite: {
        '^/': '/users/',
      },
    }),
  );

  expressApp.use(
    '/api/uploads',
    createProxyMiddleware({
      target: 'http://localhost:3003',
      changeOrigin: true,
      pathRewrite: {
        '^/': '/uploads/',
      },
    }),
  );

  expressApp.use(
    '/api/contacts',
    createProxyMiddleware({
      target: 'http://localhost:3005',
      changeOrigin: true,
      pathRewrite: {
        '^/': '/contacts/',
      },
    }),
  );

  expressApp.use(
    '/api/shares',
    createProxyMiddleware({
      target: 'http://localhost:3006',
      changeOrigin: true,
      pathRewrite: {
        '^/': '/shares/',
      },
    }),
  );

  expressApp.use(
    '/api/share-usage',
    createProxyMiddleware({
      target: 'http://localhost:3007',
      changeOrigin: true,
      pathRewrite: {
        '^/': '/share-usage/',
      },
    }),
  );

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port, '0.0.0.0');

  console.log(`API gateway is running on port ${port}`);
}

await bootstrap();
