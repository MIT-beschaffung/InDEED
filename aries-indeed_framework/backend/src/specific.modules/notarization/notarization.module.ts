import { Module } from '@nestjs/common';
import { NotarizationController } from './notarization.controller';
import { NotarizationService } from './notarization.service';
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import { QuorumModule } from 'src/generic.modules/quorum/quorum.module';
import { LoggeddataGenericModule } from 'src/specific.modules/loggedData/loggeddataGeneric.module';
import { QuorumService } from 'src/generic.modules/quorum/quorum.service';
import { DatabaseModule } from 'src/generic.modules/database/database.module';
import { MerkleTreeModule } from 'src/generic.modules/merkletree/merkletree.module';

@Module({
    imports: [ConfigModule, MyLoggerModule, QuorumModule, LoggeddataGenericModule, DatabaseModule, MerkleTreeModule],
    controllers: [NotarizationController],
    providers: [NotarizationService, QuorumService],
    exports: [NotarizationService]
})
export class NotarizationModule {}
