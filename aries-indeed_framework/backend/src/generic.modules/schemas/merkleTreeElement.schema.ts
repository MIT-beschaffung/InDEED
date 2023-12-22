import { Schema } from 'mongoose';

// @ts-ignore
export const merkleTreeElementSchema = new Schema(
    {
        position: { type: String, required: true },
        data: { type: String, required: true },
    },
    { _id: false },
);
