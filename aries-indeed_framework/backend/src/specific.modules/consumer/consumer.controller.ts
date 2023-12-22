import {Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiSecurity,
    ApiTags
} from '@nestjs/swagger';
import {APIKEYAuthGuard} from 'src/specific.modules/authentication/guards/apikey-auth.guard';
import {ConsumerService} from './consumer.service';
import {DatabaseService} from "../../generic.modules/database/database.service";
import {databases} from "../../generic.modules/database/db.enum";
import {MyLogger} from 'src/generic.modules/logger/logger.service';
import {HttpService} from "@nestjs/axios";

@ApiTags('Consumer')
@Controller('consumer')
@UseGuards(APIKEYAuthGuard)
export class ConsumerController {

    constructor(
        private readonly MyLogger: MyLogger,
        private readonly HttpService: HttpService,
        private readonly ConsumerService: ConsumerService,
        private readonly DatabaseService: DatabaseService
    ){
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    @Delete('reset')
    @ApiOperation( {summary: 'Resets the databases for labeling for demo purposes'})
    @ApiSecurity('api_key', ['api_key'])
    async deleteAll() {
        this.MyLogger.info('Deleting all data from the databases');
        this.MyLogger.error('Not yet implemented');
    }

    @Post()
    @ApiOperation({summary: 'Create a new LogData Input'})
    @ApiBody({type: Object, description: 'Logdata, that you want to insert'})
    @ApiCreatedResponse({description: 'Returned if LogData was successfully created'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    sendNewChatMessage(@Body() completeBody){
        return this.DatabaseService.saveOne(completeBody, databases.ConsumerConsumptionDB);
    }

    @Get(':id')
    @ApiOperation({summary: 'Get logged labeling data by ID'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async getLogDataById(@Param('id') id: string) {
        try {
            const res = await this.DatabaseService.findByID(id, databases.ConsumerConsumptionDB);
            this.MyLogger.debug('Queried record with ID ' + id);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get the document with this id: ' +
                id + 'in this database' + databases.ConsumerConsumptionDB + '\n' + error);
            return error;
        }
    }

    @Post('getLabelingProof:id')
    @ApiOperation({summary: 'Get labelingProof for logged data that was previously submitted to the UBT InDEED backend'})
    @ApiResponse({ status: 200, description: 'The update was successful.' })
    @ApiParam( { name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async updateLoggedDataWithLabelingProof(@Param('id') id: string) {
        await this.ConsumerService.updateLoggedDataWithLabelingProof(id);
    }

    //TODO: passing an object to ConsumerService.search() enables code injection on the ConsumerConsumptionDB
    @Post('search')
    @ApiOperation({summary: 'Create a new Search Request for LogData'})
    @ApiBody({type: Object, description: 'Search Criteria, that you want to insert'})
    @ApiCreatedResponse({description: 'Returned if LogData was successfully created'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    search(@Body() completeBody){
            try {
                return this.ConsumerService.search(completeBody)
            } catch (error) {
                return 'Criteria was malformed or not assigned'
            }
    }

    @Get()
    @ApiOperation({summary: 'Returns all LogData IDs and their timestamps'})
    @ApiOkResponse({description: 'Returned if LogData could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    async getAllLogData(){
        return await this.DatabaseService.getAllIDs(databases.ConsumerConsumptionDB)
    }

    @Post('search/byID')
    @ApiOperation({summary: 'Find LogData by ID'})
    @ApiBody({type: Object, description: 'ID from Logdata, that you want to find'})
    @ApiOkResponse({description: 'Returned if LogData could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    getLogDatabyID(@Body() completeBody){
        if(completeBody['id']){
            return this.ConsumerService.findbyID(completeBody['id']);
        } else 
        throw new NotFoundException('Please assign an ID for the LogData you want to look up')
    }


    @Patch()
    @ApiOperation({summary: 'Update LogData by ID'})
    @ApiBody({type: Object, description: 'ID from Logdata, and the updated parameters for the document you want to edit'})
    @ApiOkResponse({description: 'Returned if LogData could be updated'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    editChatMessage(@Body() completeBody){
        return this.ConsumerService.updateOne(completeBody)
    }

    @Delete()
    @ApiOperation({summary: 'Delete LogData by ID'})
    @ApiBody({type: Object, description: 'ID from Logdata you want to delete'})
    @ApiOkResponse({description: 'Returned if LogData could be deleted'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    deleteChatMessage(@Body() completeBody){
        return this.ConsumerService.deleteOne(completeBody)
    }
}
