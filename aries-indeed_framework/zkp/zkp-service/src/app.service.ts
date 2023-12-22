import { Injectable } from '@nestjs/common';
import { HttpService} from '@nestjs/axios';

const fs = require('fs');
import { BigNumber } from 'bignumber.js';
import { MyLogger } from './logger/logger.service';
import { ProofDto } from './proof.dto';
import { labelingZKPInfoDto } from './labelingZKPInputDto';
import {ConfigService} from './config.service';
const Web3 = require('web3');
const artifact = require('/usr/build/contracts/Verifier.json');

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);



@Injectable()
export class AppService {
    constructor(
        private MyLogger: MyLogger,
        private config: ConfigService,
        private readonly httpService: HttpService
    ) {
        this.MyLogger.setContext(this.constructor.name.toString())
    }

    p256(n) {
        let nstr = new BigNumber(n).toString(16);
        while (nstr.length < 64) nstr = '0' + nstr;
        nstr = '0x' + nstr;
        return nstr;
    }

    // largely copied from https://raw.githubusercontent.com/iden3/snarkjs/0c0334179879cab4b3ce3eebb019462d8173f418/build/snarkjs.js
    async groth16ExportSolidityCallData(proof, pub) {
        let inputs = [];
        for (let i = 0; i < pub.length; i++) {
            if (inputs != [])
                inputs.push(this.p256(pub[i]));
        }

        let P;
        P = [[this.p256(proof.pi_a[0]), this.p256(proof.pi_a[1])],
            [[this.p256(proof.pi_b[0][1]), this.p256(proof.pi_b[0][0])], [this.p256(proof.pi_b[1][1]), this.p256(proof.pi_b[1][0])]],
            [this.p256(proof.pi_c[0]), this.p256(proof.pi_c[1])],
            inputs
        ];
        return P;
    }

    async createProofLabeling(witness: Object): Promise<ProofDto> {

        // this.MyLogger.error('CreateProof - So far: ' + JSON.stringify(witness, null, 4));
        this.MyLogger.info('Input dimensions: consumers:' + witness['consumers'].length + " - producers:" + witness['producers'].length);
        // this.MyLogger.info('samples - starttime:' + witness['starttime'] + '; consumers:' + witness['consumers'][0] + "; producers:" + witness['producers'][0]);

        let result = {};

        let stdout = "";
        let stderr = "";

        try {
            await fs.writeFileSync(
                '/usr/circuits/labeling/input.json',
                JSON.stringify(witness, null, 4),
                'utf-8',
            );

            this.MyLogger.debug("Starting time measurement");
            let startTime = Date.now();

            // node/wasm witness generation and node proof generation (snarkjs)
            //let {stdout, stderr} = await exec("cd /usr/circuits/labeling/labeling_js && node generate_witness.js labeling.wasm ../input.json witness.wtns && cd .. && snarkjs groth16 prove labeling_0001.zkey ./labeling_js/witness.wtns proof.json public.json");

            // c++ witness generation and rapidsnark proof generation
            // let {
            //     stdout,
            //     stderr
            // } = await exec("cd /usr/circuits/labeling/ && cat input.json");
            // this.MyLogger.warn('stdout: ' + stdout + '\n errors: ' + stderr);
            
            let {
                stdout,
                stderr
            } = await exec("cd /usr/circuits/labeling/labeling_cpp \
                            && ./labeling ../input.json witness.wtns && cd .. \
                            && /usr/rapidsnark/build/prover labeling_0001.zkey ./labeling_cpp/witness.wtns proof.json public.json");

            this.MyLogger.debug("Ending time measurement");
            let endTime = Date.now();
            this.MyLogger.log("Proof creation took " + (endTime-startTime) + "ms");

            this.MyLogger.debug(`Stdout (including circom logs): ${(JSON.stringify(stdout)).replace(/\\n/g, "  ")}`);
            this.MyLogger.debug(`Stderr (including circom logs): ${(JSON.stringify(stderr)).replace(/\\n/g, "  ")}`);

            let proof = JSON.parse(
                fs.readFileSync('/usr/circuits/labeling/proof.json', 'utf-8'),
            );
            let publicOutputs = JSON.parse(
                fs.readFileSync('/usr/circuits/labeling/public.json', 'utf-8'),
            );

            this.MyLogger.debug("Public outputs consumer root: " + publicOutputs[0]);
            this.MyLogger.debug("Public outputs producer root: " + publicOutputs[2]);

            let result = new ProofDto(proof, publicOutputs);
            // this.MyLogger.debug("Proof: " + JSON.stringify(result));
            return result;
        } catch (err) {
            this.MyLogger.error('An error occurred when creating the ZKP: ' + JSON.stringify(err));
            this.MyLogger.warn(`Stdout (including circom logs): ${(JSON.stringify(stdout)).replace(/\\n/g, "  ")}`);
            this.MyLogger.warn(`Stderr (including circom logs): ${(JSON.stringify(stderr)).replace(/\\n/g, "  ")}`);
            this.MyLogger.log('Returning ' + JSON.stringify(result));
        }
    }

    async verifyProofLabeling(inputs: ProofDto): Promise<boolean> {
        try {
            //this.MyLogger.log("Verifying proof");
            //this.MyLogger.debug(JSON.stringify(inputs, null, 2));
            let proof = inputs.getGroth16Proof();
            // this.MyLogger.debug("Proof: ");
            // this.MyLogger.debug(JSON.stringify(proof, null, 2));
            //console.log(proof);
            let publicOutputs = inputs.getPublicInputs();
            // this.MyLogger.log("Public outputs: ");
            // this.MyLogger.log(JSON.stringify(publicOutputs, null, 2));
            //console.log(publicOutputs);

            await fs.writeFileSync('/usr/circuits/labeling/proof.json', JSON.stringify(proof, null, 4), "utf-8");
            await fs.writeFileSync('/usr/circuits/labeling/public.json', JSON.stringify(publicOutputs, null, 4), "utf-8");

            let {
                stdout,
                stderr
            } = await exec("cd /usr/circuits/labeling && snarkjs groth16 verify verification_key.json public.json proof.json");

            this.MyLogger.debug(`stdout: ${stdout.replace("\n", "")}`);
            this.MyLogger.debug(`stderr: ${stderr}`);

            if ('[32;22m[INFO]  [39;1msnarkJS[0m: OK!' == stdout) {
                console.log('True');
            } else {
                //console.log(stdout);
                //console.log(typeof(stdout))

                if (stdout.substring(36, 38) == 'OK') {
                    return true;
                } else if (stdout.substring(36, 49) == 'Invalid proof') {
                    return false;
                } else {
                    throw Error('Unexpected return value of snarkjs verify');
                }
            }
            throw Error('An error occurred');
        } catch (err) {
            this.MyLogger.error("Error during proof verification: " + JSON.stringify(err));
            throw Error('An error occurred');
        }
    }

    async publishProofLabeling(input): Promise<boolean> {
        try {
            this.MyLogger.debug('Value of input for witness generation: ' + JSON.stringify(input));
            this.MyLogger.info("Computing witness and proof from input");
            let inputs: ProofDto = await this.createProofLabeling(input);

            let status: boolean = await this.verifyProofLabeling(inputs);
            this.MyLogger.log('Proof is ' + status);

            if (status) {
                this.MyLogger.log('Publishing proof');

                try {
                    let quorumUrl = 'http://quorum_quorum-node1_1:8545';
                    this.MyLogger.debug('Quorum node URL: ' + quorumUrl);
                    const provider = new Web3.providers.HttpProvider(quorumUrl);
                    const web3 = new Web3(provider);
                    
                    const instance = new web3.eth.Contract(
                    artifact.abi,
                    artifact.networks['10'].address,
                );

                let adminAccount = await web3.eth.getAccounts().catch((err) => {
                    this.MyLogger.error("Error when fetching account: " + JSON.stringify(err));
                });
                this.MyLogger.debug('Admin account: ' + adminAccount);

                let proof = await this.groth16ExportSolidityCallData(
                    inputs.getGroth16Proof(),
                    inputs.getPublicInputs(),
                    );
                    
                    this.MyLogger.debug("Proof: " + JSON.stringify(proof));
                    
                    try {
                        let transactionReceipt = await instance.methods
                        .verifyProof(proof[0], proof[1], proof[2], proof[3])
                        .send({
                            from: adminAccount[0].toString(),
                            gas: 300000,
                        })
                        .catch((err) => {
                            return Promise.reject(err);
                        });
                        // this.MyLogger.debug(
                            //     'transactionReceipt: ' + JSON.stringify(transactionReceipt),
                            // );
                            //console.log(returnValue.events.Registered)
                            
                            let transactionHash = transactionReceipt.transactionHash;
                            // let contractAddress = artifact.networks['10'].address
                            
                        this.MyLogger.debug("Registered transaction hash: " + transactionHash);
                        this.MyLogger.log("Sending transaction hash and public inputs to the UBT (EVU) backend");
                        const data = new labelingZKPInfoDto(
                            true,
                            transactionHash,
                            inputs.getPublicInputs()
                            );
                        this.MyLogger.info("Sending " + JSON.stringify(data));
                        try {
                            let result =
                                await this.httpService.post("http://nestjs-ubt:8105/labeling/receiveLabelingProofWebhook",
                                    data,{headers: {'api_key': this.config.ApiKey}}).toPromise();
                            this.MyLogger.debug(JSON.stringify(result.data, null, 4));
                        } catch (err3) {
                            this.MyLogger.error('Failed receivLableingProofWebhook: ' + err3);
                        }
                        
                        return transactionReceipt.status;
                    } catch (error) {
                        this.MyLogger.error("Could not reach quorum node1: " + error)   
                    }
                } catch (err) {
                    this.MyLogger.error("Error when publishing the ZKP: " + JSON.stringify(err));
                    throw("Transaction failed")
                }
            }
        } catch (err) {
            this.MyLogger.error(err + "trying to reach 'computing witness' (publishProofLabeling)");//; input = " + JSON.stringify(input));

            try {
                this.MyLogger.error("Proof creation and publishing not successful")
                this.MyLogger.error('Input for ZKP generation: ' + JSON.stringify(input));
                const data = new labelingZKPInfoDto(
                    false,
                    "0x",
                    []
                );
                this.MyLogger.info("Sending " + JSON.stringify(data));
                let result = await this.httpService.post("http://nestjs-ubt:8105/labeling/receiveLabelingProofWebhook",
                    data, {headers: {'api_key': this.config.ApiKey}}).toPromise();
                this.MyLogger.debug(JSON.stringify(result.data, null, 4));
                return false
            } catch (err2) {
                this.MyLogger.error("Error when sending the webhook about unsuccessful proof publishing: " + JSON.stringify(err2));
                return false
            }
        }
    }
}
