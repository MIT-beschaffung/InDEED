import { Global, Module } from '@nestjs/common';
import { ConfigModule } from 'src/config.module';
import { MyLogger } from './logger.service';

//this is our customized logging module

@Module({
    imports: [ConfigModule],
    providers: [MyLogger],
    exports: [MyLogger],
})
export class MyLoggerModule {}
