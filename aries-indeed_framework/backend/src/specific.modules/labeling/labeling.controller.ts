import {Body, Controller, Delete, Get, Param, Patch, Post, UseGuards} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
    ApiSecurity
} from '@nestjs/swagger';
import {MyLogger} from 'src/generic.modules/logger/logger.service';
import {DatabaseService} from 'src/generic.modules/database/database.service';
import {databases} from 'src/generic.modules/database/db.enum';
import {loggedProsumerDataDto} from './labelingData.dto';
import {LabelingService} from './labeling.service';
import {labelingProofDto} from './labelingProof.dto';
import {MerkleTreeService} from '../../generic.modules/merkletree/merkletree.service';
import {roles} from '../../generic.modules/schemas/roles.enum';
import * as inputs from './input.json'
import {labelingZKPInfoDto} from "./labelingZKPInputDto";
import {masterDataService} from '../masterData/masterData.service';
import { Cron } from '@nestjs/schedule';
import {APIKEYAuthGuard} from "../authentication/guards/apikey-auth.guard";

@ApiTags('Labeling')
@Controller('labeling')
@UseGuards(APIKEYAuthGuard)
export class LabelingController {
    constructor(
        private MyLogger: MyLogger,
        private readonly labelingService: LabelingService,
        private readonly databaseService: DatabaseService,
        private HttpService: HttpService,
        private MerkleTreeService: MerkleTreeService,
        private masterDataService: masterDataService,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    /**
     * @global_starttime for comparison
     */
    @Cron('0 */5 * * * *')
    setStarttime() {
    this.labelingService.setStarttime();
    }

    @Post('fillDummyLoggedData')
    @ApiOperation({summary: 'Fills additional dummy data for labeling'})
    @ApiSecurity('api_key', ['api_key'])
    async fillDummyData() {
        this.MyLogger.info('serving /fillDummyLoggedData');
        await this.labelingService.fillDummyData();
        return "Filled with DummyData (new version)"
    }

    @Delete('reset')
    @ApiOperation( {summary: 'Resets the databases for labeling for demo purposes'})
    @ApiSecurity('api_key', ['api_key'])
    async deleteAll() {
        this.MyLogger.info('Deleting all data from the three databases (loggedProsumerData, CommittedProsumerData, VerifiableProsumerData)');
        await this.labelingService.deleteAll(databases.LoggedProsumerDataDB);
        await this.labelingService.deleteAll(databases.CommittedProsumerDataDB);
        await this.labelingService.deleteAll(databases.VerifiableProsumerDataDB);
    }

    @Post('testrun')
    @ApiOperation({summary: 'Makes a test for bringing everything together'})
    @ApiSecurity('api_key', ['api_key'])
    async testrun() { 
        await this.deleteAll();
        for (let i = 0; i < inputs.consumers.length; i++) {
            await this.labelingService.logOne(
                new loggedProsumerDataDto(
                    parseInt(inputs.consumers[i][1]) + parseInt(inputs.consumers[i][2]),
                    0,
                    0,
                    inputs.consumers[i][0],
                    '',    // consumers do not need a y coordinate of public key 
                    [],    // signedMsg (only Prod)
                    parseInt(inputs.consumers[i][3]),
                    'Consumer',
                    0
                )
            );
        }
        
        for (let i = 0; i < inputs.producers.length; i++) {
            await this.labelingService.logOne(
                new loggedProsumerDataDto(
                    0,
                    parseInt(inputs.producers[i][2]),
                    parseInt(inputs.producers[i][3]),
                    inputs.producers[i][0],
                    inputs.producers[i][1],
                    [inputs.producers[i][5],    // = R[x]    // signedMsg (only Prod; poseidon)
                    inputs.producers[i][6],    // = R[y]
                    inputs.producers[i][7]],   // = S
                    parseInt(inputs.producers[i][4]),
                    'Producer',
                    0
                )
            );
        }
        await this.labelingService.initializeOptimization();
        return "Aggregated labeling data";
    }

    @Post()
    @ApiOperation({summary: 'Records new labeled data'})
    @ApiBody({type: loggedProsumerDataDto, description: 'A JSON object representing the data that should be labeled'})
    @ApiCreatedResponse({description: 'Returns a labeledData entry'})
    @ApiBadRequestResponse({description: 'Returns if the request was malformed'})
    @ApiResponse({status: 201, description: 'The labeling entry has been successfully created.'})
    @ApiSecurity('api_key', ['api_key'])
    async recordLabeledData(@Body() completeBody) {  // power in W !
        // TODO: Remove dirty hack
        this.MyLogger.info('Received logData');
        try {
            if ( typeof(completeBody['ownerPubKey_x']) == 'undefined' ) {
                this.MyLogger.warn("ownerPubKey_x ist undefined");
            }
            await this.masterDataService.ensureRegistered(completeBody['ownerPubKey_x']);
            const result = await this.labelingService.logOne(completeBody);
            this.MyLogger.debug('Created new logData record');
            return result;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to create a new document in this database: ' +
                    databases.LoggedDataDB + '\n' + error);
            return error;
        }
    }

    @Get('loggedDataIDs')
    @ApiOperation({summary: 'Returns IDs and timestamps of all currently logged labeling data'})
    @ApiOkResponse({description: 'Returned if labeled data could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    async getAllLogData() {
        this.MyLogger.info('serving /loggedDataIDs');
        try {
            const result = await this.databaseService.getAllIDs(databases.LoggedProsumerDataDB);
            this.MyLogger.debug('Returning all data in the database');
            return result;
        } catch (error) {
            this.MyLogger.error(
                'The following error occurred while trying to get all ids in this database: ' +
                    databases.LoggedProsumerDataDB + '\n' + error);
            return error;
        }
    }

    @Get('labeledDataIDs')
    @ApiOperation({summary: 'Returns IDs and timestamps of all currently saved verifiable labeling data'})
    @ApiOkResponse({description: 'Returned if labeled data could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    async getAllLabeledIDs() {
        this.MyLogger.info('serving /labeledDataIDs');
        try {
            const result = await this.databaseService.getAllIDs(databases.VerifiableProsumerDataDB);
            this.MyLogger.debug('Returning all data in the database');
            return result;
        } catch (error) {
            this.MyLogger.error(
                'The following error occurred while trying to get all ids in this database: ' +
                databases.VerifiableProsumerDataDB + '\n' + error);
            return error;
        }
    }

    @Get('loggedData/:id')
    @ApiOperation({summary: 'Get logged labeling data by ID'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async getLogDataById(@Param('id') id: string) {
        this.MyLogger.info('serving /loggedData/:id');
        try {
            const res = await this.databaseService.findByID(id, databases.LoggedProsumerDataDB);
            this.MyLogger.debug('Queried record with ID ' + id);
            this.MyLogger.warn('Query result ' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get the document with this id: ' +
                id + 'in this database' + databases.LoggedProsumerDataDB + '\n' + error);
            return error;
        }
    }

    @Get('labeledData/:id')
    @ApiOperation({summary: 'Get verifiable labeled data by ID'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async getLabeledDataById(@Param('id') id: string) {
        this.MyLogger.info("Serving /labeledData for id " + id);
        return await this.labelingService.getLabeledDataById(id);
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete labeled data by ID'})
    @ApiResponse({status: 200, description: 'The record has been successfully deleted.'})
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async deleteLogDataById(@Param('id') id: string) {
        this.MyLogger.info('serving /delete/:id');
        try {
            const res = await this.databaseService.deleteByID(id, databases.LoggedProsumerDataDB);
            this.MyLogger.debug('Queried record with ID ' + id);
            this.MyLogger.debug('This record was found: ' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to query in ' + databases.LoggedProsumerDataDB +
                    'for this id: ' + id + '\n this is the error statement: ' + error);
            return error;
        }
    }

    @Patch()
    @ApiOperation({summary: 'Update LabeledData by ID'})
    @ApiBody({type: Object, description: 'ID from labeled data, and the updated parameters for the document you want to edit'})
    @ApiOkResponse({description: 'Returned if labeled data could be updated'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    async updateLabeledData(@Body() completeBody) {
        this.MyLogger.info('serving PATCH /');
        this.MyLogger.warn(JSON.stringify(completeBody))
        const result = await this.databaseService.updateOne(completeBody.id, completeBody.data, databases.LoggedProsumerDataDB);
        this.MyLogger.warn(JSON.stringify(result))
        return result;
    }

    @Cron('5 2-59/5 * * * *')
    @Post('triggerLabelingProofGeneration')
    @ApiOperation({summary: 'Create Labeling Merkle proofs for the loggedProsumerData and initiate the generation of a corresponding ZKP'})
    @ApiResponse({status: 201, description: 'The proof has been requested'})
    @ApiSecurity('api_key', ['api_key'])
    async triggerProofService() {
        this.MyLogger.log('Triggers a labeling proof for the currently logged data');
        await this.labelingService.initializeOptimization();
        return 'Triggered aggregation and generation of the ZKP';
    }

    @Post('receiveOptimizationWebhook')
    @ApiOperation({summary: 'Receive a webhook from the optimization service'})
    @ApiBody({type: Object, description: 'A JSON that includes the result of the optimizer'})
    @ApiResponse({status: 200, description: 'The webhook was successfully received'})
    @ApiSecurity('api_key', ['api_key'])
    async handleOptimizationWebhook(@Body() completeBody: JSON) {
        this.MyLogger.log("Handling optimization webhook");
        await this.labelingService.handleOptimizationWebhook(completeBody);
        return "HandleOptimizationWebhook successfully called";
    }

    @Post('receiveLabelingProofWebhook')
    @ApiOperation({summary: 'Receive a webhook from the ZKP proof generation service that creates verifiable labeling proofs from labeling Merkle proofs'})
    @ApiBody({type: Object, description: 'A JSON that includes the transaction hash of the ZKP verifier smart contract call'})
    @ApiResponse({status: 200, description: 'The webhook was successfully received'})
    @ApiSecurity('api_key', ['api_key'])
    async handleProofWebhook(@Body() completeBody: labelingZKPInfoDto) {
        this.MyLogger.info("Handling proof webhook");
        await this.labelingService.handleProofWebhook(completeBody);
        return "HandleProofWebhook successfully called";
    }

    @Post('verifyLabelingProof:role')
    @ApiOperation({summary: 'Verify a labeling proof through locally checking the Labeling Merkle proof and reading the ZKP data from the Quorum blockchain'})
    @ApiBody({type: labelingProofDto, description: 'A labeling proof'})
    @ApiParam({ name: 'role', type: String, description: 'Either Consumer or Producer' })
    @ApiResponse({ status: 201, description: 'The record was checked.' })
    @ApiSecurity('api_key', ['api_key'])
    async verifyLabelingProof(@Body() completeBody: labelingProofDto, @Param('role') role: roles) {
        this.MyLogger.info('serving /verifyLabelingProof/:role');
        try {
            return this.labelingService.verifyLabelingProof(completeBody, role);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to verify a labeling proof: ');
            this.MyLogger.error(error);
        }
    }
}
