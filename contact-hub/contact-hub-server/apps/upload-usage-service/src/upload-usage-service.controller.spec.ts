import { Test, TestingModule } from '@nestjs/testing';
import { UploadUsageServiceController } from './upload-usage-service.controller.js';
import { UploadUsageServiceService } from './upload-usage-service.service.js';

describe('UploadUsageServiceController', () => {
  let uploadUsageServiceController: UploadUsageServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UploadUsageServiceController],
      providers: [UploadUsageServiceService],
    }).compile();

    uploadUsageServiceController = app.get<UploadUsageServiceController>(UploadUsageServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(uploadUsageServiceController.getHello()).toBe('Hello World!');
    });
  });
});
