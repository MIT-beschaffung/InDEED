import { Schema } from 'mongoose';
import { merkleTreeElementSchema } from './merkleTreeElement.schema';

export const merkleProofSchema = new Schema(
    {
        root: { type: String, required: true },
        lemma: [merkleTreeElementSchema],
        leaf: { type: String, required: true },
    },
    { _id: false },
);
