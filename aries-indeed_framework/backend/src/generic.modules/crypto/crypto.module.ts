import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { CryptoController } from './crypto.controller';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module'

@Module({
  imports: [MyLoggerModule],
  providers: [CryptoService, Object],
  controllers: [CryptoController],
  exports: [CryptoService]
})
export class CryptoModule {}
