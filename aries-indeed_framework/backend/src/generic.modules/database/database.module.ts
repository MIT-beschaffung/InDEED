import { Module } from '@nestjs/common';
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from '../logger/logger.module';
import { DatabaseService } from './database.service';
import { modelProviders } from './model.providers';
import { mongooseProviders } from './mongoose.providers';

@Module({
    imports: [ConfigModule, MyLoggerModule],
    providers: [...mongooseProviders, DatabaseService, ...modelProviders],
    exports: [DatabaseService],
})
export class DatabaseModule {}
