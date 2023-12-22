import { Global, Module } from '@nestjs/common';
import { MyLogger } from './logger.service';

//this is our customized logging module

@Module({
    providers: [MyLogger],
    exports: [MyLogger],
})
export class MyLoggerModule {}
