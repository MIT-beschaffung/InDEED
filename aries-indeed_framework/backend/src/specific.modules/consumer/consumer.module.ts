import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from 'src/config.module';
import { DatabaseModule } from 'src/generic.modules/database/database.module';
import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import { LabelingModule } from "../labeling/labeling.module";
import {ConsumerfrontendModule} from "../consumerfrontend/consumerfrontend.module";

@Module({
    imports: [
        MyLoggerModule,
        HttpModule,
        DatabaseModule,
        ConfigModule,
        DatabaseModule,
        ConsumerModule,
        LabelingModule
    ],
    controllers: [ConsumerController],
    providers: [ConsumerService],
    exports: [ConsumerService],
})
export class ConsumerModule {}
