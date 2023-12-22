import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config.service';
import { MyLogger } from './generic.modules/logger/logger.service';
import { ServerRole } from './serverRoles.enum';
import { json, urlencoded } from "express";
import * as cookieParser from "cookie-parser";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));
    const configService = app.get(ConfigService);
    const logger = new MyLogger(configService);
    logger.setContext(bootstrap.name.toString());
    app.useLogger(logger);
    app.use(cookieParser());

    let description;
    if (configService.name == ServerRole.UBT) {
        description = 'The ' + configService.name + ' InDEED API for logging, aggregating, notarizing, and labeling data';
    } else if (configService.name == ServerRole.CONSUMER) {
        description = 'The ' + configService.name + ' InDEED API for recording consumer data (on a Raspberry Pi)';
    } else if (configService.name == ServerRole.OWNER) {
        description = 'The ' + configService.name + ' InDEED API for collecting and aggregating logData (prior to notarization)';
    } else {
        description = 'Description TBD';
    }

    const config = new DocumentBuilder()
        .addApiKey(
            {
                type: 'apiKey',
                name: 'api_key',
                in: 'header',
                description: 'API KEY for External calls',
            },
            'api_key',
        )
        .setTitle(configService.name + ' - API')
        .setDescription(description)
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    await app.listen(configService.socketEndpointPort);
    logger.debug('Successfully started ' + configService.name + ' - Backend');
    logger.debug(`Application is running on: ${await app.getUrl()}`);
    //logger.log(configService.ApiKey);
}
bootstrap();
