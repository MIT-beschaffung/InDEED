import * as mongoose from 'mongoose';
import { locationSchema } from './locations.schema';

// @ts-ignore
export const masterRegistrySchema = new mongoose.Schema({
    pubKey_x: { type: String, required: true},
    location: { type: locationSchema, required: true},
    preference:{ type: Object, required: false},
    source:{ type: String, required: false},
    prosumer_name:{ type: String, required: true}
    });

export interface masterRegistry extends mongoose.Document {
    pubKey_x: string,
    location: object,
    preference?: object,
    source?: string,
    prosumer_name: string,
}
