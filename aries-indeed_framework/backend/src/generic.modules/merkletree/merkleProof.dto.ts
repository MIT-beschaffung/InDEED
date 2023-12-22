import { ApiProperty } from "@nestjs/swagger";
import {IsArray, IsNotEmpty, ValidateNested} from "class-validator";
import { merkleLemmaElementDto } from "./merkleLemmaElement.dto";

/*
// Transforms string[] to TagDto[]
const transformTags = tags => {
  if (Array.isArray(tags)) {
    return tags.map(tag => ({name: tag}))
  } else {
    return tags;
  }
}
 */

//import { Transform } from 'class-transformer';
export class merkleProofDto {

    @ApiProperty({name: 'root', description: 'The Merkle proof root'})
    @IsNotEmpty()
    root: string;

    @ApiProperty({name: 'lemma', description: 'The Merkle proof lemma (array) that describes the path from leaf to root'})
    @IsNotEmpty()
    @ValidateNested({ each: true })
    //@Transform(transformTags, {toClassOnly: true})
    lemma: merkleLemmaElementDto[];

    @ApiProperty({name: 'leaf', description: 'The leaf of the Merkle proof'})
    @IsNotEmpty()
    leaf: string;

    constructor(
        root: string,
        lemma: merkleLemmaElementDto[],
        leaf: string
    ) {
        this.root = root;
        this.lemma = lemma;
        this.leaf = leaf;
    }

    setRoot(root: string) {
        this.root = root;
    }

    setLemma(lemma: merkleLemmaElementDto[]) {
        this.lemma = lemma;
    }

    setLeaf(leaf: string) {
        this.leaf = leaf;
    }

    getRoot(): string {
        return this.root;
    }

    getLemma(): merkleLemmaElementDto[] {
        return this.lemma;
    }

    getLeaf(): string {
        return this.leaf
    }

}
