import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from 'src/generic.modules/database/database.module';
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import { MerkleTreeService } from './merkletree.service';
import { PoseidonMerkleUtils } from './poseidonMerkleUtils';

@Module({
    imports: [
        DatabaseModule,
        HttpModule,
        ConfigModule,
        MyLoggerModule,
        PoseidonMerkleUtils,
    ],
    providers: [MerkleTreeService],
    controllers: [],
    exports: [MerkleTreeService],
})
export class MerkleTreeModule {}
