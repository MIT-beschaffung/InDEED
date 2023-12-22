import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MyLogger } from './logger/logger.service';
import { json, urlencoded } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  const Logger = new MyLogger()
  Logger.setContext(bootstrap.name)
  app.useLogger(Logger)


  const config = new DocumentBuilder()
      .setTitle('ZKP-Service API')
      .setDescription(
          'This is the ZKP-Service API',
      )
      .setVersion('1.0')
      .build();


  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);


  await app.listen(8100);
  Logger.log(`Application is running on: ${await app.getUrl()}`)

}
bootstrap();
