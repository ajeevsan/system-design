import { Test, TestingModule } from '@nestjs/testing';
import { ShareUsageServiceController } from './share-usage-service.controller.js';
import { ShareUsageServiceService } from './share-usage-service.service.js';

describe('ShareUsageServiceController', () => {
  let shareUsageServiceController: ShareUsageServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ShareUsageServiceController],
      providers: [ShareUsageServiceService],
    }).compile();

    shareUsageServiceController = app.get<ShareUsageServiceController>(ShareUsageServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(shareUsageServiceController.getHello()).toBe('Hello World!');
    });
  });
});
