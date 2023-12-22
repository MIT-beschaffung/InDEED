import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './generic.modules/database/database.module';
import { ConfigModule } from './config.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { QuorumModule } from './generic.modules/quorum/quorum.module';
import { ConsumerModule } from './specific.modules/consumer/consumer.module';
import { ServerRole } from './serverRoles.enum';
import { ConsumerfrontendModule } from './specific.modules/consumerfrontend/consumerfrontend.module';
import { MerkleTreeModule } from 'src/generic.modules/merkletree/merkletree.module';
import { AuthModule } from 'src/specific.modules/authentication/auth.module';
import { NotarizationModule } from 'src/specific.modules/notarization/notarization.module';
import {NotarizationOwnerModule} from "./specific.modules/notarizationOwner/notarizationOwner.module";
import {RemoteNotarizationModule} from "./specific.modules/remoteNotarization/remoteNotarization.module";
import {CollectiveNotarizationModule} from "./specific.modules/collectiveNotarization/collectiveNotarization.module";
import { LabelingModule } from 'src/specific.modules/labeling/labeling.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import { AggregationModule } from 'src/specific.modules/aggregation/aggregation.module';
import { LoggeddataGenericModule } from 'src/specific.modules/loggedData/loggeddataGeneric.module';
import { LoggeddataSpecificModule} from './specific.modules/loggedData/loggeddataSpecific.module';
import { CryptoModule } from './generic.modules/crypto/crypto.module';
import {PassportModule} from "@nestjs/passport";
import {JwtModule} from "@nestjs/jwt";

let imports;
if (process.env.ROLE == ServerRole.UBT) {
    console.log('Starting UBT backend (EVU + notary)');
    imports = [
        EventEmitterModule.forRoot(),
        DatabaseModule,
        ConfigModule,
        CryptoModule,
        MyLoggerModule,
        MerkleTreeModule,
        AuthModule,
        LabelingModule,
        NotarizationModule,
        QuorumModule,
        AggregationModule,
        LoggeddataGenericModule,
        LoggeddataSpecificModule,
        CollectiveNotarizationModule
    ];
} else if (process.env.ROLE == ServerRole.OWNER) {
    console.log("Starting data owner (asset logging)");
    console.log("Quorum service URL: " + process.env.QUORUM_SERVICE_URL);
    imports = [
        EventEmitterModule.forRoot(),
        DatabaseModule,
        ConfigModule,
        MyLoggerModule,
        MerkleTreeModule,
        AuthModule,
        AggregationModule,
        NotarizationOwnerModule,
        LoggeddataGenericModule,
        RemoteNotarizationModule,
    ];
} else if (process.env.ROLE == ServerRole.CONSUMER) {
    console.log('Starting consumer');
    imports = [
        CryptoModule,
        DatabaseModule,
        MyLoggerModule,
        AuthModule,
        ConfigModule,
        EventEmitterModule.forRoot(),
        ConsumerModule,
        ConsumerfrontendModule,
    ];
} else if (process.env.ROLE == ServerRole.AUTH) {
    console.log("Starting authentication");
    imports = [
        AuthModule,
        PassportModule,
        JwtModule.register({}),
        MyLoggerModule,
        ConfigModule,
        EventEmitterModule.forRoot()
    ]
}
console.log("Using LOG_LEVEL " + process.env.LOG_LEVEL);

@Module({
    imports: imports,
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
