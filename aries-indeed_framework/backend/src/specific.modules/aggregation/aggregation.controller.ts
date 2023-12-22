import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiBadRequestResponse,
    ApiSecurity,
    ApiTags,
    ApiResponse,
    ApiOkResponse,
} from '@nestjs/swagger';
import { APIKEYAuthGuard } from 'src/specific.modules/authentication/guards/apikey-auth.guard';
import { MyLogger } from 'src/generic.modules/logger/logger.service';
import { DatabaseService } from 'src/generic.modules/database/database.service';
import { AggregationService } from './aggregation.service';
import { merkleProofForObjectDto } from 'src/generic.modules/merkletree/merkleProofForObject.dto';
import { databases } from 'src/generic.modules/database/db.enum';

@ApiTags('Aggregation')
@Controller('aggregate')
@UseGuards(APIKEYAuthGuard)
export class AggregationController {
    constructor(
        private readonly DatabaseService: DatabaseService,
        private readonly AggregationService: AggregationService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    @Post('aggregateObjects')
    @ApiOperation({summary: 'Create a Merkle tree from an array of JSON objects'})
    @ApiBody({type: [Object], description: 'Object array to be merkelized'})
    @ApiResponse({status: 201, description: 'The records have been successfully aggregated.'})
    @ApiSecurity('api_key', ['api_key'])
    async aggregateObjects(@Body() completeBody) {
        try {
            return this.AggregationService.aggregateObjects(completeBody);
        } catch (error) {
            this.MyLogger.error('The following error occurred while aggregating objects:' + error);
            return error;
        }
    }

    @Post('aggregateIds')
    @ApiOperation({summary: 'Create a Merkle tree from an array of ids associated with logged data'})
    @ApiBody({description: 'id array to be merkelized', type: [String]})
    @ApiSecurity('api_key', ['api_key'])
    async createMerkleProofsFromIds(@Body() completeBody) {
        try {
            return this.AggregationService.aggregateIDs(completeBody);
        } catch (error) {
            this.MyLogger.error('The following error occurred while aggregating objects:' + error);
            return error;
        }
    }

    @Post('verifyMerkleProof')
    @ApiOperation({summary: 'Verify a Merkle proof for an object',})
    @ApiBody({type: merkleProofForObjectDto, description: 'Merkle tree that should be verified'})
    @ApiSecurity('api_key', ['api_key'])
    async verifyMerkleProof(@Body() completeBody: merkleProofForObjectDto) {
        try {
            return this.AggregationService.verifyMerkleProof(completeBody);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to verify a MerkleProof:' + error);
            return error;
        }
    }

    @Get()
    @ApiOperation({summary: 'Returns IDs and timestamps of all currently saved documents'})
    @ApiOkResponse({description: 'Returned if LogData could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed',})
    @ApiSecurity('api_key', ['api_key'])
    async getAllLogData() {
        try {
            const result = await this.DatabaseService.getAllIDs(databases.AggregatedDataDB);
            this.MyLogger.debug('Returning all data in the database');
            return result;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get all ids in this database: ' +
                    databases.AggregatedDataDB + '\n' + error);
            return error;
        }
    }

    @Get(':id')
    @ApiOperation({summary: 'Get logged and aggregated data by ID',})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiSecurity('api_key', ['api_key'])
    async getLogDataById(@Param('id') id: string) {
        try {
            const res = await this.DatabaseService.findByID(id, databases.AggregatedDataDB);
            this.MyLogger.debug('Queried record with ID ' + id + '\n' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get a document with the following ID:' +
                    id + '.\n The Input was searched in the ' + databases.AggregatedDataDB);
            return error;
        }
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete logged and aggregated data by ID',})
    @ApiResponse({status: 200, description: 'The record has been successfully deleted.'})
    @ApiSecurity('api_key', ['api_key'])
    async deleteLogDataById(@Param('id') id: string) {
        try {
            const res = await this.DatabaseService.deleteByID(id, databases.AggregatedDataDB);
            this.MyLogger.debug('Deleted record with ID ' + id);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to delete a document with the following ID:' +
                    id + '\n The Input was searched in the ' + databases.AggregatedDataDB);
            return error;
        }
    }
}
