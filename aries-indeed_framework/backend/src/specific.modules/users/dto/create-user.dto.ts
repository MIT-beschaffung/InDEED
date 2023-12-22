import {IsArray, IsNotEmpty, IsString, IsUrl} from "class-validator";

export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    pwd_hash: string;

    @IsUrl()
    @IsNotEmpty()
    url: URL;

    @IsArray()
    roles: string[];
}