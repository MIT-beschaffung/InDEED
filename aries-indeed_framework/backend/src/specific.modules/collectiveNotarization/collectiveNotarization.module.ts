import { Module, HttpModule } from '@nestjs/common';
import {ScheduleModule} from '@nestjs/schedule';
import {CollectiveNotarizationController} from "./collectiveNotarization.controller";
import {CollectiveNotarizationService} from "./collectiveNotarization.service";
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import {LoggeddataGenericModule} from "../loggedData/loggeddataGeneric.module";
import {DatabaseModule} from "../../generic.modules/database/database.module";
import {NotarizationModule} from "../notarization/notarization.module";
@Module({
    imports: [ConfigModule, MyLoggerModule, LoggeddataGenericModule, DatabaseModule,
        NotarizationModule, HttpModule,ScheduleModule.forRoot()],
    controllers: [CollectiveNotarizationController],
    providers: [CollectiveNotarizationService]
})
export class CollectiveNotarizationModule{}