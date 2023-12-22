import { Schema,Document } from 'mongoose';

export const CollectiveNotarizationDataSchema = new Schema({
        _id: { type: String, required: true },
    }
);

export interface CollectiveNotarizationData extends Document {
    _id: string;
}