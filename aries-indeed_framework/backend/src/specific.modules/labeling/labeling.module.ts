import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LabelingController } from './labeling.controller';
import { LabelingService } from './labeling.service';
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import { DatabaseModule } from 'src/generic.modules/database/database.module';
import { LoggeddataGenericModule } from 'src/specific.modules/loggedData/loggeddataGeneric.module';
import { MerkleTreeModule } from 'src/generic.modules/merkletree/merkletree.module';
import { QuorumModule } from 'src/generic.modules/quorum/quorum.module';
import { CryptoModule } from 'src/generic.modules/crypto/crypto.module';
import { masterDataModule } from '../masterData/masterData.module';

@Module({
    imports: [
        ConfigModule,
        HttpModule,
        MyLoggerModule,
        DatabaseModule,
        LoggeddataGenericModule,
        MerkleTreeModule,
        QuorumModule,
        CryptoModule,
        masterDataModule,
    ],
    controllers: [LabelingController],
    providers: [LabelingService],
    exports: [LabelingService],
})
export class LabelingModule {}
