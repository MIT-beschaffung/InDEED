import { Test, TestingModule } from '@nestjs/testing';
import { RemoteNotarizationController } from './remoteNotarization.controller';

describe('RemoteNotarizationController', () => {
    let controller: RemoteNotarizationController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RemoteNotarizationController],
        }).compile();

        controller = module.get<RemoteNotarizationController>(RemoteNotarizationController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
