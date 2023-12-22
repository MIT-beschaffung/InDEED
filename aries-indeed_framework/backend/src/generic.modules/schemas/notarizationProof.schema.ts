import { Schema } from 'mongoose';
import { merkleProofSchema } from './merkleProof.schema';

export const notarizationProofSchema = new Schema({
        merkleProof: { type: merkleProofSchema, required: true },
        txHash: { type: String, required: true },
        data: { type: Object, required: true },
    },
    { _id: false },
);
