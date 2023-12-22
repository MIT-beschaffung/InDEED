import * as mongoose from 'mongoose';
import { roles } from './roles.enum';
import { merkleProofSchema } from './merkleProof.schema';
import { loggedProsumerDataDto } from '../../specific.modules/labeling/labelingData.dto';
import {
    labelingMerkleProofDto,
    labelingProofDto,
} from '../../specific.modules/labeling/labelingProof.dto';

// @ts-ignore
const EnergyDataSchema = new mongoose.Schema(
    {
        // greenConsumption: { type: Number, required: false },
        // grayConsumption: { type: Number, required: false },
        consumedPower: { type: Number, required: false},
        greenProduction: { type: Number, required: false },
        grayProduction: { type: Number, required: false },
        ownerPubKey_x: { type: String, required: true },
        ownerPubKey_y: { type: String, required: false },
        signedMsg: { type: [String, String, String], required: false},
        timestamp: { type: Number, required: true },
        role: { type: String, enum: roles, required: true },
        //epoch: { type: Number, required: true },
    },
    { _id: false },
);

export interface EnergyData {
    // greenConsumption?: number;
    // grayConsumption?: number;
    consumedPower?: number;
    greenProduction?: number;
    grayProduction?: number;
    ownerPubKey_x: string;
    ownerPubKey_y?: string;
    signedMsg?: string[];
    timestamp: number;
    role: string;
    //epoch: number;
}

const RawDataSchema = new mongoose.Schema({
    ownerPubkey_x: { type: String, required: true },
    ownerPubkey_y: { type: String, required: false },
    green: { type: String, required: true },
    gray: { type: String, required: true },
    timestamp: { type: String, required: true },
    //signature: { type: [], required: false }
}, {_id: false})

const LabelingMerkleProofSchema = new mongoose.Schema(
    {
        merkleProof: { type: merkleProofSchema, required: true },
        rawData: { type: RawDataSchema, required: true },
        rawDataRoot: { type: String, required: true },
        //TODO: ggf nVMD schema aus dto bauen
        nonVerifiableMasterData: {type: Object, required: false}
    },
    { _id: false },
);

const LabelingProofSchema = new mongoose.Schema({
    labelingMerkleProof: { type: LabelingMerkleProofSchema, required: true },
    txHash: { type: String, required: true },

});

// @ts-ignore
export const LoggedProsumerDataSchema = new mongoose.Schema({
    data: { type: EnergyDataSchema, required: true },
    timestampReadable: { type: String, required: true },
    timestamp: { type: Number, required: true },
    dataHash: { type: String, required: true },
});

export interface LoggedProsumerData extends mongoose.Document {
    data: EnergyData;
    timestampReadable: string;
    timestamp: number;
    dataHash: string;
    owner: roles;
    _id: string;
}

// @ts-ignore
export const CommittedProsumerDataSchema = new mongoose.Schema({
    data: { type: EnergyDataSchema, required: true },
    timestampReadable: { type: String, required: true },
    timestamp: { type: Number, required: true },
    dataHash: { type: String, required: true },
    labelingMerkleProof: { type: LabelingMerkleProofSchema, required: true },
});

export interface CommittedProsumerData extends mongoose.Document {
    data: loggedProsumerDataDto;
    timestampReadable: string;
    timestamp: number;
    dataHash: string;
    labelingMerkleProof: labelingMerkleProofDto;
    owner: roles;
    _id: string;
}

// @ts-ignore
export const VerifiableProsumerDataSchema = new mongoose.Schema({
    data: { type: EnergyDataSchema, required: true },
    timestampReadable: { type: String, required: true },
    timestamp: { type: Number, required: true },
    dataHash: { type: String, required: true },
    labelingProof: { type: LabelingProofSchema, required: true },
});

export interface VerifiableProsumerData extends mongoose.Document {
    data: loggedProsumerDataDto;
    timestampReadable: string;
    timestamp: number;
    dataHash: string;
    labelingProof: labelingProofDto;
    owner: roles;
    _id: string;
}
