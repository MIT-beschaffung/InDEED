import { Schema,Document } from 'mongoose';

import { merkleProofSchema } from './merkleProof.schema';
import {notarizationProofSchema} from "./notarizationProof.schema";

export const RemoteNotarizationDataSchema = new Schema({
        localMerkleProof: { type: merkleProofSchema, required: true },
        notarizationProof: { type: notarizationProofSchema, required: false },
        remoteID: {type: String, required:true},
        data: { type: Object, required: true },
    }
);

export interface RemoteNotarizedData extends Document {
    data: object;
    localMerkleProof: object;
    notarizationProof: object;
    remoteID: string;
    _id: string;
}
