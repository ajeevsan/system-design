import { Test, TestingModule } from '@nestjs/testing';
import { EtlServiceController } from './etl-service.controller.js';
import { EtlServiceService } from './etl-service.service.js';

describe('EtlServiceController', () => {
  let etlServiceController: EtlServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EtlServiceController],
      providers: [EtlServiceService],
    }).compile();

    etlServiceController = app.get<EtlServiceController>(EtlServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(etlServiceController.getHello()).toBe('Hello World!');
    });
  });
});
