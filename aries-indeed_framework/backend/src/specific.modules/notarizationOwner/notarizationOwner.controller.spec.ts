import { Test, TestingModule } from '@nestjs/testing';
import { NotarizationOwnerController } from './notarizationOwner.controller';

describe('NotarizationController', () => {
    let controller: NotarizationOwnerController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [NotarizationOwnerController],
        }).compile();

        controller = module.get<NotarizationOwnerController>(NotarizationOwnerController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
