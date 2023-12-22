import {Injectable} from '@nestjs/common';

@Injectable()
export class ConfigService {
    public readonly ApiKey: string;

    constructor(
        API_KEY
    ) {
        this.ApiKey = API_KEY;
    }
}
