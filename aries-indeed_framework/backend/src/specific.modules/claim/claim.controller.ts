import {Body, Controller, Delete, Get, Patch, Post, UseGuards} from '@nestjs/common';
import {OnEvent} from '@nestjs/event-emitter';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiSecurity,
    ApiTags,
} from '@nestjs/swagger';
import {APIKEYAuthGuard} from 'src/specific.modules/authentication/guards/apikey-auth.guard';
import {Events} from 'src/events';
import {ProofDto} from 'src/legacy.modules/proof/proof.dto';
import {BaseController} from 'src/generic.modules/base/base.controller';
import {ClaimDto} from './claim.dto';
import {ClaimService} from './claim.service';
import {ClaimStore} from './claim.store';

@ApiTags('Claim')
@Controller('claim')
@UseGuards(APIKEYAuthGuard)
export class ClaimController extends BaseController {
    constructor(private readonly claimService: ClaimService) {
        super();
    }

    @Get()
    @ApiOperation({summary: 'Find all Claim records'})
    @ApiOkResponse({description: 'Returned if records for Claim could be found', type: [ClaimStore]})
    @ApiSecurity('api_key', ['api_key'])
    findAll(): ClaimStore[] {
        return this.claimService.findAll();
    }

    @Post()
    @ApiOperation({summary: 'Create a new Claim record'})
    @ApiBody({type: ClaimDto, description: 'Claim record that needs to be created'})
    @ApiCreatedResponse({description: 'Returned if Claim record was successfully created', type: ClaimDto})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    create(@Body() claim: ClaimDto): ClaimDto {
        return this.claimService.create(claim);
    }

    @Patch()
    @ApiOperation({summary: 'Create a new Claim record'})
    @ApiBody({type: ClaimDto, description: 'Claim record that needs to be created'})
    @ApiCreatedResponse({description: 'Returned if Claim record was successfully created'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    update(@Body() claim: ClaimDto): void {
        return this.claimService.update(claim);
    }

    @Delete()
    @ApiOperation({summary: 'Create a new Claim record'})
    @ApiBody({type: ClaimDto, description: 'Claim record that needs to be created'})
    @ApiCreatedResponse({description: 'Returned if Claim record was successfully created'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    delete(@Body() claim: ClaimDto): void {
        return this.claimService.delete(claim);
    }
    
    @OnEvent(Events.newClaim)
    newClaim(Claim: ClaimDto){
        return this.claimService.newClaimReceived(Claim);
    }

    @OnEvent(Events.newProof)
    newProof(Proof: ProofDto){
        return this.claimService.newProofReceived(Proof);
    }
}
