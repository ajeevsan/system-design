import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { SharingServiceController } from './sharing-service.controller.js';
import { SharingServiceService } from './sharing-service.service.js';

describe('SharingServiceController', () => {
  let sharingServiceController: SharingServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SharingServiceController],
      providers: [SharingServiceService],
    }).compile();

    sharingServiceController = app.get<SharingServiceController>(
      SharingServiceController,
    );
  });

  describe('sharing contacts', () => {
    it('forwards a contact claim to the contact service', async () => {
      const claim = { employeeId: 4, limit: 5 };
      const result = { count: 5, contacts: [] };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => result,
        }),
      );

      await expect(
        sharingServiceController.claimContacts(claim),
      ).resolves.toEqual(result);

      expect(fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:3005/contacts/claim',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(claim),
        }),
      );
    });
  });

  afterEach(() => vi.unstubAllGlobals());
});
