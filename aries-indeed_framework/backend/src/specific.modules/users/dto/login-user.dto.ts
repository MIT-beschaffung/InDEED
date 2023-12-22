import {IsNotEmpty, IsString} from "class-validator";


export class LoginUserDto{
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    pwd: string;

}