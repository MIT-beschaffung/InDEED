import { ApiProperty } from "@nestjs/swagger";
import {IsArray, IsNotEmpty, ValidateNested} from "class-validator";
import { merkleProofDto } from "src/generic.modules/merkletree/merkleProof.dto";
import { ConsumerConsumptionSchema } from "src/generic.modules/schemas/consumerConsumption.schema";
import { locationDto } from "../masterData/location.dto";


export class rawConsumerLabelingDataDto {

    // add others
    "ownerPubkey_x": string;
    "green": string;
    "gray": string;
    "timestamp": string

    constructor(
        ownerPubkey_x: string,
        green: string,
        gray: string,
        timestamp: string
    ) {
        this.ownerPubkey_x = ownerPubkey_x;
        this.green = green;
        this.gray = gray;
        this.timestamp = timestamp;
    }


    setOwnerPubkey(ownerPubkey_x: string) {
        this.ownerPubkey_x = ownerPubkey_x;
    }

    getOwnerPubkey(): string {
        return this.ownerPubkey_x;
    }

    setGreen(green: string) {
        this.green = green;
    }

    getGreen(): string {
        return this.green;
    }

    setGray(gray: string) {
        this.gray = gray;
    }

    getGray(): string {
        return this.gray;
    }

    setTimestamp(timestamp: string) {
        this.timestamp = timestamp;
    }

    getTimestamp(): string {
        return this.timestamp;
    }

    toArray(): string[] {
        return [this.ownerPubkey_x,
                this.green,
                this.gray,
                this.timestamp
            ];
    }
}


export class rawProducerLabelingDataDto {

    // add others
    "ownerPubkey_x": string;
    "ownerPubkey_y": string;
    "green": string;
    "gray": string;
    "timestamp": string;
    "signature": string[];

    constructor(
        ownerPubkey_x: string,
        ownerPubkey_y: string,
        green: string,
        gray: string,
        timestamp: string,
        signature: string[],
    ) {
        this.ownerPubkey_x = ownerPubkey_x;
        this.ownerPubkey_y = ownerPubkey_y;
        this.green = green;
        this.gray = gray;
        this.timestamp = timestamp;
        this.signature = signature;
    }


    setOwnerPubkey_x(ownerPubkey_x: string) {
        this.ownerPubkey_x = ownerPubkey_x;
    }

    getOwnerPubkey_x(): string {
        return this.ownerPubkey_x;
    }

    setOwnerPubkey_y(ownerPubkey_y: string) {
        this.ownerPubkey_y = ownerPubkey_y;
    }

    getOwnerPubkey_y(): string {
        return this.ownerPubkey_y;
    }


    setGreen(green: string) {
        this.green = green;
    }

    getGreen(): string {
        return this.green;
    }

    setGray(gray: string) {
        this.gray = gray;
    }

    getGray(): string {
        return this.gray;
    }

    setTimestamp(timestamp: string) {
        this.timestamp = timestamp;
    }

    getTimestamp(): string {
        return this.timestamp;
    }

    setSignature(signature: string[]) {
        this.signature = signature;
    }

    getSignature(): string[] {
        return this.signature;
    }

    toArray(): string[] {
        return [this.ownerPubkey_x,
            this.ownerPubkey_y,
            this.green,
            this.gray,
            this.timestamp,
            this.signature[0],
            this.signature[1],
            this.signature[2],
        ];
    }
}

export class producerConsumerTransactionDto{
    @ApiProperty({name: 'producerID', description: 'public key of the producer'})
    @IsNotEmpty()
    producerID: string;

    @ApiProperty({name: 'consumerID', description: 'public key of the consumer'})
    @IsNotEmpty()
    consumerID: string;

    @ApiProperty({name: 'value', description: 'amount of transferred energy'})
    @IsNotEmpty()
    value: number;

    constructor(producerID: string, consumerID: string, value: number) {
        this.producerID = producerID;
        this.consumerID = consumerID;
        this.value = value;
    }

    getProducerID(): string {
        return this.producerID;
    }

    setProducerID(id: string) {
        this.producerID = id;
    }

    getConsumerID(): string {
        return this.consumerID;
    }

    setConsumerID(id: string) {
        this.consumerID = id;
    }

    getValue(): number {
        return this.value;
    }

    setValue(value: number) {
        this.value = value;
    }
}

export class nonVerifiableMasterDataDto {
    @ApiProperty({name: 'location', description: 'masterData: location'})
    @IsNotEmpty()
    location: locationDto;
    
    @ApiProperty({name: 'source', description: 'masterData: source'})
    @IsNotEmpty()
    source: string;
    
    @ApiProperty({name: 'prosumer_name', description: 'masterData: prosumer_name'})
    @IsNotEmpty()
    prosumer_name: string;
    
    @ApiProperty({name: 'consumerConsumption', description: 'masterData: array of green/gray consumption of all conumers'})
    @IsNotEmpty()
    consumerConsumption: number[];

    @ApiProperty({name: 'transactions', description: 'Array of transactions between the producers and consumers'})
    @IsNotEmpty()
    transactions: producerConsumerTransactionDto[];

    constructor(
        location: locationDto,
        source: string,
        prosumer_name: string,
        consumerConsumption: number[],
        transactions: producerConsumerTransactionDto[]
    ) {
        this.location = location;
        this.source = source;
        this.prosumer_name = prosumer_name;
        this.consumerConsumption = consumerConsumption;
        this.transactions = transactions;
    }

    setLocation(location: locationDto) {
        this.location = location;
    }
    
    getLocation() {
        return this.location;
    }

    setSource(source: string) {
        this.source = source;
    }

    getSource() {
        return this.source;
    }

    setProsumer_name(prosumer_name: string) {
        this.prosumer_name = prosumer_name;
    }

    getProsumer_name() {
        return this.prosumer_name;
    }

    setConsumerConsumption(consumerConsumption: number[]) {
        this.consumerConsumption = consumerConsumption;
    }

    getConsumerConsumption() {
        return this.prosumer_name;
    }

    setTransactions(transactions: producerConsumerTransactionDto[]) {
        this.transactions = transactions;
    }

    getTransactions(): producerConsumerTransactionDto[] {
        return this.transactions;
    }

}
export class labelingMerkleProofDto {

    @ApiProperty({name: 'merkleProof', description: 'The Merkle proof'})
    @IsNotEmpty()
    merkleProof: merkleProofDto;

    @ApiProperty({name: 'rawData', description: 'The raw data'})
    @IsNotEmpty()
    rawData: rawConsumerLabelingDataDto | rawProducerLabelingDataDto;

    @ApiProperty({name: 'rawDataRoot', description: 'The raw data Merkle root'})
    @IsNotEmpty()
    rawDataRoot: string;

    @ApiProperty({name: 'nonVerifiableMasterData', description: 'The masterData elements location, source, and prosumer_name'})
    // @IsNotEmpty()
    nonVerifiableMasterData: nonVerifiableMasterDataDto;

    constructor(
        merkleProof: merkleProofDto,
        rawData: rawConsumerLabelingDataDto | rawProducerLabelingDataDto,
        rawDataRoot: string,
        nonVerifiableMasterData?: nonVerifiableMasterDataDto,
    ) {
        this.merkleProof = merkleProof;
        this.rawData = rawData;
        this.rawDataRoot = rawDataRoot;
        this.nonVerifiableMasterData = nonVerifiableMasterData;
    }

    setMerkleProof(merkleProof: merkleProofDto) {
        this.merkleProof = merkleProof;
    }

    getMerkleProof(): merkleProofDto {
        return this.merkleProof;
    }

    setRawData(rawData: rawConsumerLabelingDataDto | rawProducerLabelingDataDto) {
        this.rawData = rawData;
    }

    getRawData(): rawConsumerLabelingDataDto | rawProducerLabelingDataDto {
        return this.getRawData();
    }

    setRawDataRoot(rawDataRoot: string) {
        this.rawDataRoot = rawDataRoot;
    }

    getRawDataRoot(): string {
        return this.getRawDataRoot();
    }

    setNonVerifiableMasterData(nonVerifiableMasterData: nonVerifiableMasterDataDto) {
        this.nonVerifiableMasterData = nonVerifiableMasterData;
    }

    getNonVerifiableMasterData(): nonVerifiableMasterDataDto {
        return this.nonVerifiableMasterData;
    }

}


export class labelingProofDto {

    @ApiProperty({name: 'labelingMerkleProof', description: 'The Labeling Merkle proof'})
    @IsNotEmpty()
    labelingMerkleProof: labelingMerkleProofDto;

    @ApiProperty({name: 'txHash', description: 'transaction that points to the root referenced in the Merkle proof'})
    @IsNotEmpty()
    txHash: string;

    constructor(
        labelingMerkleProof: labelingMerkleProofDto,
        txHash: string,
    ) {
        this.labelingMerkleProof = labelingMerkleProof;
        this.txHash = txHash;
    }

    setLabelingMerkleProof(labelingMerkleProof: labelingMerkleProofDto) {
        this.labelingMerkleProof = labelingMerkleProof;
    }

    getLabelingMerkleProof(): labelingMerkleProofDto {
        return this.labelingMerkleProof;
    }

    setTxHash(txHash: string) {
        this.txHash = txHash;
    }

    getTxHash(): string {
        return this.txHash;
    }

}