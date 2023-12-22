import { ApiProperty } from "@nestjs/swagger";
import {IsNotEmpty, ValidateNested} from "class-validator";
import {merkleProofDto} from "../../generic.modules/merkletree/merkleProof.dto";
import {notarizationProofForObjectDto} from "../notarization/notarizationProofForObject.dto";

export class RemoteNotarizationProofDto {

    @ApiProperty({name: '_id', description: 'Owner-Id of the remoteNotarizationProof'})
    _id: string;

    @ApiProperty({name: 'object', description: 'The object (JSON) for which the proof is created'})
    @IsNotEmpty()
    data: object;

    @ApiProperty({name: 'localMerkleProof', description: 'The merkle proof for the local aggregation'})
    @IsNotEmpty()
    localMerkleProof: merkleProofDto;

    @ApiProperty({name: 'notarizationProof', description: 'The notarization for the remote aggregation'})
    @IsNotEmpty()
    notarizationProof: notarizationProofForObjectDto;

    constructor(
        localMerkleProof: merkleProofDto,
        data: object
    ) {
        this.localMerkleProof = localMerkleProof;
        this.data = data;
    }


}