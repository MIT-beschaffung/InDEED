import * as mongoose from 'mongoose';

export const MerklerootSchema = new mongoose.Schema({
    root: { type: String, required: true },
});

export interface Merkleroot extends mongoose.Document {
    root: string;
    _id: string;
}
