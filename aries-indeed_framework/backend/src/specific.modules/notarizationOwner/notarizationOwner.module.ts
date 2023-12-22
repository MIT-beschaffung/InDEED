import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotarizationOwnerController } from './notarizationOwner.controller';
import { NotarizationOwnerService } from './notarizationOwner.service';
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import {QuorumModule} from "../../generic.modules/quorum/quorum.module";
import {LoggeddataGenericModule} from "../loggedData/loggeddataGeneric.module";
import {DatabaseModule} from "../../generic.modules/database/database.module";
import {MerkleTreeModule} from "../../generic.modules/merkletree/merkletree.module";
import {AggregationModule} from "../aggregation/aggregation.module";

@Module({
    imports: [HttpModule, ConfigModule, MyLoggerModule, LoggeddataGenericModule, DatabaseModule,
        MerkleTreeModule, AggregationModule],
    controllers: [NotarizationOwnerController],
    providers: [NotarizationOwnerService]
})
export class NotarizationOwnerModule{}