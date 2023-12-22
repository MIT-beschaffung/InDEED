import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MyLoggerModule } from './logger/logger.module';
import {ConfigModule} from "./config.module";

console.log('Starting ZKP Service backend for generating zero-knowledge proofs for Labeling (part of EVU)');
console.log("Using LOG_LEVEL " + process.env.LOG_LEVEL);

@Module({
  imports: [ HttpModule, MyLoggerModule, ConfigModule ],
  controllers: [AppController ],
  providers: [ AppService ]
})
export class AppModule {}
