import { Test, TestingModule } from '@nestjs/testing';
import { CollectiveNotarizationController} from "./collectiveNotarization.controller";

describe('CollectiveNotarizationController', () => {
    let controller: CollectiveNotarizationController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CollectiveNotarizationController],
        }).compile();

        controller = module.get<CollectiveNotarizationController>(CollectiveNotarizationController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
