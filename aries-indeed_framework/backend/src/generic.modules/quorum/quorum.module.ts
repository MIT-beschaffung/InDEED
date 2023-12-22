import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import { QuorumService } from './quorum.service';
import { ConfigModule } from 'src/config.module'
import { QuorumController } from './quorum.controller';

@Module({
  imports: [HttpModule, MyLoggerModule, ConfigModule],
  providers: [QuorumService],
  exports: [QuorumService],
  controllers: [QuorumController]
})
export class QuorumModule {}
