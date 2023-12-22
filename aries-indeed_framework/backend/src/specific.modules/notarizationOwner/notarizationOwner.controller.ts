import {Body, Controller, Delete, Get, Param, Post, UseGuards} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiSecurity,
    ApiTags
} from '@nestjs/swagger';
import {MyLogger} from "../../generic.modules/logger/logger.service";
import {APIKEYAuthGuard} from 'src/specific.modules/authentication/guards/apikey-auth.guard';
import {NotarizationOwnerService} from "./notarizationOwner.service";
import {databases} from "../../generic.modules/database/db.enum";
import {DatabaseService} from "../../generic.modules/database/database.service";
import {notarizationOwnerProofForObjectDto} from "./notarizationOwnerProofForObject.dto";

@ApiTags('NotarizationOwner')
@Controller('notarizeOwner')
@UseGuards(APIKEYAuthGuard)
export class NotarizationOwnerController {

    constructor(
        private readonly notarizationOwnerService: NotarizationOwnerService,
        private readonly MyLogger: MyLogger,
        private readonly databaseService: DatabaseService
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }
    
    @Post('notarizeIds')
    @ApiOperation({summary: 'Notarizes the logged data corresponding to an array of ids'})
    @ApiBody({description: 'id array of logged data to be notarized', type: [String]})
    @ApiSecurity('api_key', ['api_key'])
    async notarizeIds(@Body() completeBody) {
        this.MyLogger.info('serving /notarizeIds');
        try {
            return this.notarizationOwnerService.notarizeIDs(completeBody);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to notarize some IDs');
            this.MyLogger.error(error);
        }
    }

    @Get()
    @ApiOperation({summary: 'Returns IDs and timestamps of all currently saved documents'})
    @ApiOkResponse({description: 'Returned if LogData could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    async getAllLogData() {
        this.MyLogger.info('serving GET /');
        try {
            const result = await this.databaseService.getAllIDs(databases.NotarizedOwnerDataDB);
            this.MyLogger.debug('Returning all IDs in the database');
            return result;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get all ids in this database: ' +
                databases.NotarizedOwnerDataDB + '\n' + error);
            return error;
        }
    }
    
    @Get(':id')
    @ApiOperation({summary: 'Get logged and notarized data by ID'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async getLogDataById(@Param('id') id: string) {
        this.MyLogger.info('serving GET /:id');
        try {
            const res = await this.databaseService.findByID(id, databases.NotarizedOwnerDataDB);
            this.MyLogger.debug('Queried record with ID ' + id);
            this.MyLogger.debug('This record was found: ' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to query in ' +
                databases.NotarizedOwnerDataDB + 'for this id: ' + id + '\n this is the error statement: ' + error);
            return error;
        }
    }
    
    @Delete(':id')
    @ApiOperation({summary: 'Delete logged and notarized data by ID'})
    @ApiResponse({status: 200, description: 'The record has been successfully deleted.'})
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async deleteLogDataById(@Param('id') id: string) {
        this.MyLogger.info('serving DELETE /:id');
        try {
            const res = await this.databaseService.deleteByID(id, databases.NotarizedOwnerDataDB);
            this.MyLogger.debug('Deleted record with ID ' + id);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to delete a document in ' +
                databases.NotarizedOwnerDataDB + 'with this id: ' + id + '\n this is the error statement: ' + error);
            return error;
        }
    }

    @Post('verifyNotarizeOwner')
    @ApiOperation({summary: 'Verify notarizationOwner-proof is valid'})
    @ApiBody({type: notarizationOwnerProofForObjectDto, description: 'Merkle tree that should be verified'})
    @ApiSecurity('api_key', ['api_key'])
    async verifyMerkleProof(@Body() completeBody: notarizationOwnerProofForObjectDto) {
        this.MyLogger.info('serving /verifyNotarizeOwner');
        try {
            return this.notarizationOwnerService.verifyNotarizationOwnerProof(completeBody);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to verify a NotarizationOwnerProof:' + error);
            return error;
        }
    }
}