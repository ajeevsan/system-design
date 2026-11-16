import 'reflect-metadata';
import { DataSource } from 'typeorm';
import {
  Contact,
  ContactStatus,
} from '../../contact-service/src/entities/contact.entity.js';
import { ShareDailyUsage } from '../../contact-service/src/entities/share-daily-usage.entity.js';
import { ShareUsageServiceService } from './share-usage-service.service.js';

describe('ShareUsageServiceService', () => {
  let dataSource: DataSource;
  let service: ShareUsageServiceService;

  beforeEach(async () => {
    dataSource = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Contact, ShareDailyUsage],
      synchronize: true,
    }).initialize();
    service = new ShareUsageServiceService(dataSource);
  });

  afterEach(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('reports daily shares, contacted status, and interests for each employee', async () => {
    await dataSource.getRepository(ShareDailyUsage).insert({
      employeeId: 3,
      quotaDate: '2026-01-02',
      contactsShared: 2,
    });
    await dataSource.getRepository(Contact).insert([
      {
        uploadId: 'upload-1',
        employeeId: 3,
        worksheetId: 1,
        sourceRow: 1,
        name: 'Contact 1',
        email: 'contact1@example.com',
        phone: '123',
        interest: 'Travel',
        status: ContactStatus.CONTACTED,
        contactedByEmployeeId: 3,
        contactedAt: new Date('2026-01-02T12:00:00Z'),
      },
      {
        uploadId: 'upload-1',
        employeeId: 3,
        worksheetId: 1,
        sourceRow: 2,
        name: 'Contact 2',
        email: 'contact2@example.com',
        phone: '123',
        interest: 'Technology',
        status: ContactStatus.CLAIMED,
      },
    ]);

    const report = await service.getUsage('3', '2026-01-01', '2026-01-31');

    expect(report.users[0]).toMatchObject({
      employeeId: 3,
      contactsShared: 2,
      contactsUsed: 1,
      contactsWaiting: 1,
      daily: [{ date: '2026-01-02', contactsShared: 2, contactsUsed: 1 }],
      interests: [{ interest: 'Travel', contactsUsed: 1 }],
    });
  });

  it('rejects invalid date ranges', async () => {
    await expect(service.getUsage(undefined, '2026-02-31')).rejects.toThrow(
      'valid date',
    );
    await expect(
      service.getUsage(undefined, '2026-02-02', '2026-02-01'),
    ).rejects.toThrow('on or before');
  });
});
