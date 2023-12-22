import * as mongoose from 'mongoose';
import { notarizationProofSchema } from './notarizationProof.schema';

export const NotarizedDataSchema = new mongoose.Schema({
    data: { type: {}, required: true },
    timestampReadable: { type: String, required: true },
    timestamp: { type: Number, required: true },
    dataHash: { type: String, required: true },
    notarizationProof: { type: notarizationProofSchema, required: true },
    owner: { type: String, required: true },
});

export interface NotarizedData extends mongoose.Document {
    data: object;
    timestampReadable: string;
    timestamp: number;
    dataHash: string;
    notarizationProof: object;
    owner: string;
    _id: string;
}
