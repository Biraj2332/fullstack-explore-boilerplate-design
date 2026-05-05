import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import crypto from 'crypto';

async function bootstrap() {
  const logger = new Logger('ApiGateway');
  const app = await NestFactory.create(AppModule);

  // ─── Security headers ─────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        imgSrc:      ["'self'", 'data:', 'blob:'],
        connectSrc:  ["'self'"],
        fontSrc:     ["'self'"],
        objectSrc:   ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // required for Swagger UI
  }));

  // ─── CORS — allow only the frontend origin ────────────────────────────────
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',');
  app.enableCors({
    origin: (origin, cb) => {
      // allow non-browser requests (curl, Swagger) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
  });

  // ─── Request ID injection ─────────────────────────────────────────────────
  app.use((_req: any, _res: any, next: () => void) => {
    _req.headers['x-request-id'] = _req.headers['x-request-id'] ?? crypto.randomUUID();
    _res.setHeader('X-Request-Id', _req.headers['x-request-id']);
    next();
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableShutdownHooks();

  // ─── Graceful shutdown ────────────────────────────────────────────────────
  const signals = ['SIGTERM', 'SIGINT'] as const;
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.log(`Received ${signal} — starting graceful shutdown`);
      await app.close();
      logger.log('Application closed cleanly');
      process.exit(0);
    });
  }

  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription('API Gateway — single entry point for all microservices')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('gateway', 'Gateway endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, { swaggerOptions: { persistAuthorization: true } });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`API Gateway running on http://localhost:${port}/api`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  logger.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
}
bootstrap();

