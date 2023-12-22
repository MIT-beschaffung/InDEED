import { Controller } from '@nestjs/common';
import { BaseDto } from './base.dto';
import { BaseStore } from './base.store';

@Controller('base')
export abstract class BaseController {
    abstract findAll(): BaseStore<BaseDto>[];

    abstract create(baseDto: BaseDto): BaseDto;

    abstract update(baseDto: BaseDto);

    abstract delete(baseDto: BaseDto);
}
