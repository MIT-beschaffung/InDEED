import * as mongoose from 'mongoose';

// @ts-ignore
export const LoggedDataSchema = new mongoose.Schema({
    data: { type: {}, required: true },
    timestampReadable: { type: String, required: true },
    timestamp: { type: Number, required: true },
    dataHash: { type: String, required: true },
    owner: { type: String, required: true },
});

export interface LoggedData extends mongoose.Document {
    data: object;
    timestampReadable: string;
    timestamp: number;
    dataHash: string;
    owner: string;
    _id: string;
}
