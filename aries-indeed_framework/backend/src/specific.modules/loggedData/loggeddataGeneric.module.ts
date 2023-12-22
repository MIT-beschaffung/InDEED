import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import { MerkleTreeModule } from 'src/generic.modules/merkletree/merkletree.module';
import { DatabaseModule } from "src/generic.modules/database/database.module";
import { LoggeddataGenericController } from './loggeddataGeneric.controller';
import { LoggeddataService } from './loggeddata.service';


@Module({
  imports: [HttpModule, ConfigModule, DatabaseModule, MyLoggerModule, MerkleTreeModule ],
  controllers: [LoggeddataGenericController],
  providers: [LoggeddataService],
  exports: [LoggeddataService]
})
export class LoggeddataGenericModule {}
