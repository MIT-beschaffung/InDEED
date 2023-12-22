import { Module } from '@nestjs/common';
import { ClaimService } from './claim.service';
import { ClaimController } from './claim.controller';
import { WebsocketGateway } from 'src/websocket.gateway';
import { AriesClientModule } from 'src/generic.modules/aries-client/aries-client.module';
import { MerkleProofModule } from 'src/legacy.modules/proof/proof.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';

@Module({
    imports: [
        AriesClientModule,
        MerkleProofModule,
        // AssetlogsModule,
        MyLoggerModule,
    ],
    providers: [ClaimService, WebsocketGateway],
    controllers: [ClaimController],
    exports: [ClaimService],
})
export class ClaimModule {}
