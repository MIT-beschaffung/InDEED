import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { masterDataController } from './masterData.controller';
import { masterDataService } from './masterData.service';
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import { DatabaseModule } from 'src/generic.modules/database/database.module';

@Module({
    imports: [
        ConfigModule,
        HttpModule,
        MyLoggerModule,
        DatabaseModule,
    ],
    controllers: [masterDataController],
    providers: [masterDataService],
    exports: [masterDataService],
})
export class masterDataModule {}
