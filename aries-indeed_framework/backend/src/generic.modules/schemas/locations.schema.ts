import { Schema } from 'mongoose';

export const locationSchema = new Schema({
    latitude: { type: Number, required: true},
    longitude: { type: Number, required: true},
},
{ _id: false }
);
