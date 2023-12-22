import * as mongoose from 'mongoose';
import { notarizationProofSchema } from './notarizationProof.schema';
import {AggregatedDataSchema} from './aggregatedData.schema';
import {merkleProofSchema} from "./merkleProof.schema";

export const NotarizedOwnerDataSchema = new mongoose.Schema({
    data: { type: {}, required: true },
    timestampReadable: { type: String, required: true },
    timestamp: { type: Number, required: true },
    dataHash: { type: String, required: true },
    merkleProof: { type: merkleProofSchema, required: true },
    txHash: { type: String, required: false },
    owner: { type: String, required: true },
});

export interface NotarizedOwnerData extends mongoose.Document {
    data: object;
    timestampReadable: string;
    timestamp: number;
    dataHash: string;
    txHash: object;
    merkleProof: object;
    owner: string;
    _id: string;
}
