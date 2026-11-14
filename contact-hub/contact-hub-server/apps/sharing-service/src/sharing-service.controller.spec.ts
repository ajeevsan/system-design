import { Test, TestingModule } from '@nestjs/testing';
import { SharingServiceController } from './sharing-service.controller.js';
import { SharingServiceService } from './sharing-service.service.js';

describe('SharingServiceController', () => {
  let sharingServiceController: SharingServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SharingServiceController],
      providers: [SharingServiceService],
    }).compile();

    sharingServiceController = app.get<SharingServiceController>(SharingServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(sharingServiceController.getHello()).toBe('Hello World!');
    });
  });
});
