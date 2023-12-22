import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AppService } from './app.service';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { MyLogger } from './logger/logger.service';

const { exec } = require('child_process');

@Controller()
export class AppController {
  constructor(
      private readonly appService: AppService,
      private readonly httpService: HttpService,
      private MyLogger: MyLogger
  ) {
      this.MyLogger.setContext(this.constructor.name.toString());
  }

  @ApiTags('Labeling')
  @Post('/zkp/create-proof')
  @ApiOperation({
    summary: 'Create a zero-knowledge proof for some witness',
  })
  @ApiBody({
    type: Object,
    description: 'Input that will be used for generating the witness',
  })
  @ApiResponse({
    status: 200,
    description: 'The proof was created successfully.',
  })
  //@ApiSecurity('api_key', ['api_key'])
  //@UseGuards(APIKEYAuthGuard)
  async createProofLabeling(@Body() completeBody): Promise<Object> {
    try {
      let returnValue = await this.appService.createProofLabeling(completeBody);
      this.MyLogger.log('returning ' + JSON.stringify(returnValue));
      return returnValue;
    } catch(err) {
      return {};
    }
  }

  @ApiTags('Labeling')
  @Post('/zkp/verify-proof')
  @ApiOperation({
    summary: 'Verify a zero-knowledge proof and public output',
  })
  @ApiBody({
    type: Object,
    description: 'Proof and public outputs to be verified',
  })
  @ApiResponse({ status: 200, description: 'The proof was verified.' })
  //@ApiSecurity('api_key', ['api_key'])
  //@UseGuards(APIKEYAuthGuard)
  async verifyProof(@Body() completeBody) {
    return await this.appService.verifyProofLabeling(completeBody);
  }


  @ApiTags('Labeling')
  @Post('/zkp/publish-proof')
  @ApiOperation({
    summary:
      'Publish and verify a zero-knowledge proof for some witness on the Quorum blockchain',
  })
  @ApiBody({
    type: Object,
    description: 'Witness for the proof generation',
  })
  @ApiResponse({ status: 200, description: 'The proof was verified.' })
  //@ApiSecurity('api_key', ['api_key'])
  //@UseGuards(APIKEYAuthGuard)
  async publishProofLabeling(@Body() completeBody) {
    try {
      this.MyLogger.notice("Serving publish proof request");
      this.MyLogger.log("Received publish proof request");
      this.appService.publishProofLabeling(completeBody);
      return "Proof requested successfully";
    } catch(err) {
      this.MyLogger.error("Error when requesting proof");
      return "Error"
    }
  }
}
