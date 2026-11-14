import { Test, TestingModule } from '@nestjs/testing';
import { UploadServiceController } from './upload-service.controller.js';
import { UploadServiceService } from './upload-service.service.js';

describe('UploadServiceController', () => {
  let uploadServiceController: UploadServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UploadServiceController],
      providers: [UploadServiceService],
    }).compile();

    uploadServiceController = app.get<UploadServiceController>(UploadServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(uploadServiceController.getHello()).toBe('Hello World!');
    });
  });
});
