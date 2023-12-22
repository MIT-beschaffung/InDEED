import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from 'src/generic.modules/database/database.module';
import { AggregationController } from './aggregation.controller';
import { ConfigModule } from 'src/config.module';
import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
import { MerkleTreeModule } from 'src/generic.modules/merkletree/merkletree.module';
import { AggregationService } from './aggregation.service';

@Module({
    imports: [
        DatabaseModule,
        HttpModule,
        ConfigModule,
        MerkleTreeModule,
        MyLoggerModule,
    ],
    controllers: [AggregationController],
    providers: [AggregationService],
    exports: [AggregationService]
})
export class AggregationModule {}
