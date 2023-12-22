import * as mongoose from 'mongoose';
import { merkleProofDto } from '../merkletree/merkleProof.dto';
import { merkleProofSchema } from './merkleProof.schema';

/*
Defines the DB Model and interface for preprocessed Data.
*/

// @ts-ignore
export const AggregatedDataSchema = new mongoose.Schema({
    data: { type: {}, required: true },
    timestampReadable: { type: String, required: true },
    timestamp: { type: Number, required: true },
    dataHash: { type: String, required: true },
    merkleProof: { type: merkleProofSchema, required: true },
    owner: { type: String, required: true },
});

export interface AggregatedData extends mongoose.Document {
    data: object;
    timestampReadable: string;
    timestamp: number;
    dataHash: string;
    merkleProof: object;
    owner: string;
    _id: string;
}
