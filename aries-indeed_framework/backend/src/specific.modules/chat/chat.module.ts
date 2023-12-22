import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MyLogger } from 'src/generic.modules/logger/logger.service';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import { AriesClientModule } from 'src/generic.modules/aries-client/aries-client.module';

@Module({
  imports: [MyLoggerModule, AriesClientModule],
  providers: [ChatService],
  exports: [ChatService],
  controllers: [ChatController]
})
export class ChatModule {}
