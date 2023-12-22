import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiCreatedResponse,
    ApiBadRequestResponse,
    ApiOkResponse,
    ApiTags,
    ApiSecurity,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';
import { APIKEYAuthGuard } from 'src/specific.modules/authentication/guards/apikey-auth.guard';

import { MyLogger } from 'src/generic.modules/logger/logger.service';
import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { ProducerLogData } from 'src/generic.modules/schemas/legacy/producer.model';
import { databases } from 'src/generic.modules/database/db.enum';
import { DatabaseService } from 'src/generic.modules/database/database.service';

@ApiTags('VerifiableProsumerData')
@Controller('verifiableprosumerdata')
export class VerifiableProsumerDataController {
    
    constructor(
        private readonly databaseService: DatabaseService,
        private MyLogger: MyLogger 
    ) {
        
        this.MyLogger.setContext(this.constructor.name.toString());
    }
    
    @Get()
    @ApiOperation({
        summary: 'Returns IDs and timestamps of all currently saved documents',
    })
    @ApiOkResponse({
        description: 'Returned if LogData could be found',
    })
    @ApiBadRequestResponse({
        description: 'Returned if the request was malformed',
    })
    @ApiSecurity('api_key', ['api_key'])
    @UseGuards(APIKEYAuthGuard)
    async getAllLogData() {
        try {
            const result = await this.databaseService.getAllIDs(
                databases.VerifiableProsumerDataDB,
            );
            this.MyLogger.debug('Returning all IDs in the database');
            return result;
        } catch (error) {
            this.MyLogger.error(
                'The following error occured while trying to get all ids in this database: ' +
                    databases.VerifiableProsumerDataDB +
                    '\n' +
                    error,
            );
            return error;
        }
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get saved data by ID',
    })
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    @UseGuards(APIKEYAuthGuard)
    async getLogDataById(@Param('id') id: string) {
        try {
            const res = await this.databaseService.findByID(
                id,
                databases.VerifiableProsumerDataDB,
            );
            this.MyLogger.debug('Queried record with ID ' + id + '\n' + res);
            return res;
        } catch (error) {
            this.MyLogger.error(
                'The following error occured while trying to get the document with this id: ' +
                    id +
                    'in this database' +
                    databases.VerifiableProsumerDataDB +
                    '\n' +
                    error,
            );
            return error;
        }
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete saved data by ID',
    })
    @ApiResponse({
        status: 200,
        description: 'The record has been successfully deleted.',
    })
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    @UseGuards(APIKEYAuthGuard)
    async deleteLogDataById(@Param('id') id: string) {
        try {
            const res = await this.databaseService.deleteByID(
                id,
                databases.VerifiableProsumerDataDB,
            );
            this.MyLogger.debug('Deleted record with ID ' + id);
            this.MyLogger.debug('This record was found: ' + res);
            return res;
        } catch (error) {
            this.MyLogger.error(
                'The following error occured while trying to delete in ' +
                    databases.VerifiableProsumerDataDB +
                    'for this id: ' +
                    id +
                    '\n this is the error statement: ' +
                    error,
            );
            return error;
        }
    }
}