import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConsumerfrontendController } from './consumerfrontend.controller';
import { ConsumerfrontendService } from './consumerfrontend.service';
import { DatabaseModule } from 'src/generic.modules/database/database.module';
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import { CryptoModule } from 'src/generic.modules/crypto/crypto.module';
import { ConsumerModule } from 'src/specific.modules/consumer/consumer.module';
import {AuthModule} from "../authentication/auth.module";

@Module({
    imports: [
        HttpModule,
        DatabaseModule,
        ConfigModule,
        MyLoggerModule,
        CryptoModule,
        ConsumerModule,
        AuthModule
    ],
    controllers: [ConsumerfrontendController],
    providers: [ConsumerfrontendService],
})
export class ConsumerfrontendModule {}
