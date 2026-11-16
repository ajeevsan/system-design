import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { ShareUsageServiceController } from './share-usage-service.controller.js';
import { ShareUsageServiceService } from './share-usage-service.service.js';

describe('ShareUsageServiceController', () => {
  let shareUsageServiceController: ShareUsageServiceController;

  const usageService = {
    getUsage: vi.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ShareUsageServiceController],
      providers: [
        { provide: ShareUsageServiceService, useValue: usageService },
      ],
    }).compile();

    shareUsageServiceController = app.get<ShareUsageServiceController>(
      ShareUsageServiceController,
    );
  });

  describe('share usage', () => {
    it('passes employee and date filters to the reporting service', async () => {
      await shareUsageServiceController.getUsage(
        '7',
        '2026-01-01',
        '2026-01-31',
      );

      expect(usageService.getUsage).toHaveBeenCalledWith(
        '7',
        '2026-01-01',
        '2026-01-31',
      );
    });
  });
});
