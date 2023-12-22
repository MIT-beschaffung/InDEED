import { Module } from '@nestjs/common';
import { modelProviders } from 'src/generic.modules/database/model.providers';
import { MerkleProofController } from './proof.controller';
import { MerkleProofService } from './proof.service';
import { DatabaseModule } from '../../generic.modules/database/database.module';
import { AriesClientModule } from 'src/generic.modules/aries-client/aries-client.module';
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';

// This module handles incoming proof request for assetlogs.
// It gets the requested assetlog from the mongodb (at the moment by ID),
// checks with the root_id if the merkleproof is correct and
// returns the full assetlog object (from mongodb)

@Module({
    imports: [AriesClientModule, DatabaseModule, ConfigModule, MyLoggerModule],
    controllers: [MerkleProofController],
    providers: [MerkleProofService, ...modelProviders],
    exports: [MerkleProofService],
})
export class MerkleProofModule {}
