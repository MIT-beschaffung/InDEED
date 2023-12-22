import { Module, HttpModule } from '@nestjs/common';
import {ScheduleModule} from '@nestjs/schedule';
import { RemoteNotarizationController } from './remoteNotarization.controller';
import { RemoteNotarizationService } from './remoteNotarization.service';
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import {LoggeddataGenericModule} from "../loggedData/loggeddataGeneric.module";
import {DatabaseModule} from "../../generic.modules/database/database.module";
import {MerkleTreeModule} from "../../generic.modules/merkletree/merkletree.module";
import {AggregationModule} from "../aggregation/aggregation.module";

@Module({
    imports: [ConfigModule, MyLoggerModule, LoggeddataGenericModule, DatabaseModule,
        MerkleTreeModule, AggregationModule, HttpModule, ScheduleModule.forRoot()],
    controllers: [RemoteNotarizationController],
    providers: [RemoteNotarizationService,]
})
export class RemoteNotarizationModule{}