import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import * as process from "process";

@Module({
    providers: [
        {
            provide: ConfigService,
            useValue: new ConfigService(
                process.env.API_KEY,
            ),
        },
    ],
    exports: [ConfigService],
})
export class ConfigModule {}
