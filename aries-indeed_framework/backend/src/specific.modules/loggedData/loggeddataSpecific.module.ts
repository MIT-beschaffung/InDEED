import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import { MerkleTreeModule } from 'src/generic.modules/merkletree/merkletree.module';
import { DatabaseModule } from "src/generic.modules/database/database.module";
import { RheinenergieController} from "./rheinenergie.controller";
import { SMAController } from './sma.controller';
import { SMAprobandenController } from './smaProbanden.controller';
import { LiqwotecController } from "./liqwotec.controller";
import { LEWController } from "./lew.controller";
import { SchweigerController } from "./schweiger.controller";
import { LoggeddataService } from "./loggeddata.service";
import { LabelingModule } from '../labeling/labeling.module';
import { ffeController } from './ffe.controller';
import { CryptoModule } from 'src/generic.modules/crypto/crypto.module';
import { keyPairDto } from '../labeling/keyPair.dto';
import { masterDataModule } from "src/specific.modules/masterData/masterData.module";
import {AuthModule} from "../authentication/auth.module";

@Module({
  imports: [HttpModule,
    ConfigModule,
    DatabaseModule,
    MyLoggerModule,
    MerkleTreeModule,
    LabelingModule,
    CryptoModule,
    masterDataModule,
    AuthModule],
  controllers: [LEWController, LiqwotecController, RheinenergieController, SchweigerController, SMAController, SMAprobandenController, ffeController],

  providers: [LoggeddataService, Number, keyPairDto, Array, Object]
})
export class LoggeddataSpecificModule {}
