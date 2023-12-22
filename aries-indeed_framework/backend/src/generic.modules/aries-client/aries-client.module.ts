import { Module } from '@nestjs/common';
import  { HttpModule } from '@nestjs/axios';
import { ConfigModule } from 'src/config.module';
import { AriesClientService } from './aries-client.service';
import { AriesClientController } from './aries-client.controller';
import { MyLoggerModule } from '../logger/logger.module';

export interface AriesClientOptions {
    walletName: string;
    baseURI: string;
    port: number;
    apiKey?: string;
}

@Module({
    imports: [HttpModule, ConfigModule, MyLoggerModule],
    providers: [AriesClientService],
    exports: [AriesClientService],
    controllers: [AriesClientController],
})
export class AriesClientModule { }
