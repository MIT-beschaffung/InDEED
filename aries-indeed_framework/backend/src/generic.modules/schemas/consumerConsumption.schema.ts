import * as mongoose from 'mongoose';
import { locationDto } from 'src/specific.modules/masterData/location.dto';
import {labelingProofDto} from "../../specific.modules/labeling/labelingProof.dto";

/*
Defines the DB Model and interface for preprocessed Data.
*/

export const ConsumerConsumptionSchema = new mongoose.Schema({
    timestamp: { type: Number, required: true },
    consumption: { type: Number, required: true },
    greenConsumption: { type: Number, required: false },
    grayConsumption: { type: Number, required: false },
    hashedData: { type: String, required: false },
    labelingProof: { type: {}, required: false },
    location: { type: [], required: false },
    asset_type: { type: [], required: false },
    optimized_consumptions: {type: [], required: false },
    transactions: { type: [], required: false }
});

export interface ConsumerConsumption extends mongoose.Document {
    timestamp: number;
    greenConsumption: number;
    labelingProof: labelingProofDto;
    hashedData: string;
    _id: string;
    location: [];
    asset_type: [];
    optimized_consumptions: [];
    transactions: [];
}
