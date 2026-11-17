import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Contact, ContactStatus } from './entities/contact.entity.js';
import { ShareDailyUsage } from './entities/share-daily-usage.entity.js';
import { ContactServiceService } from './contact-service.service.js';

function contact(
  employeeId: number,
  sourceRow: number,
  status = ContactStatus.AVAILABLE,
  claimExpiresAt: Date | null = null,
) {
  return {
    uploadId: `upload-${employeeId}`,
    employeeId,
    worksheetId: 1,
    sourceRow,
    name: `Contact ${sourceRow}`,
    email: `contact${sourceRow}@example.com`,
    phone: '123',
    interest: 'Testing',
    status,
    claimExpiresAt,
  };
}

describe('ContactServiceService', () => {
  let db: DataSource;
  let service: ContactServiceService;

  beforeEach(async () => {
    db = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Contact, ShareDailyUsage],
      synchronize: true,
    }).initialize();
    service = new ContactServiceService(db.getRepository(Contact));
  });

  afterEach(async () => {
    if (db?.isInitialized) await db.destroy();
  });

  it('claims only the requested employee records and does not return claimed records again', async () => {
    const repository = db.getRepository(Contact);
    await repository.insert([
      contact(1, 1),
      contact(1, 2),
      contact(1, 3),
      contact(2, 4),
      contact(1, 5, ContactStatus.IMPORTING),
    ]);

    const first = await service.claimAvailableContacts(1, 2);
    const second = await service.claimAvailableContacts(1, 2);
    const third = await service.claimAvailableContacts(1, 2);

    expect(first.count).toBe(2);
    expect(
      first.contacts.every((row) => row.status === ContactStatus.CLAIMED),
    ).toBe(true);
    expect(second.count).toBe(1);
    expect(third.count).toBe(0);
    expect(
      [...first.contacts, ...second.contacts].every(
        (row) => row.employeeId === 1,
      ),
    ).toBe(true);
  });

  it('rejects a claim larger than 2000', async () => {
    await expect(service.claimAvailableContacts(1, 2001)).rejects.toThrow(
      'between 1 and 2000',
    );
  });

  it('enforces the 2000-contact daily limit across multiple claims', async () => {
    const repository = db.getRepository(Contact);
    await repository.insert([contact(1, 1), contact(1, 2)]);
    await db.getRepository(ShareDailyUsage).insert({
      employeeId: 1,
      quotaDate: new Date().toISOString().slice(0, 10),
      contactsShared: 1999,
    });

    const lastAllowedContact = await service.claimAvailableContacts(1, 2);

    expect(lastAllowedContact.count).toBe(1);
    expect(lastAllowedContact.dailyUsage).toMatchObject({
      used: 2000,
      remaining: 0,
    });
    await expect(service.claimAvailableContacts(1, 1)).rejects.toThrow(
      'Daily contact share limit',
    );
    expect((await repository.findOneByOrFail({ id: 2 })).status).toBe(
      ContactStatus.AVAILABLE,
    );
  });

  it('makes an expired claim available for a new claim and records completed outreach', async () => {
    const repository = db.getRepository(Contact);
    await repository.insert(
      contact(1, 1, ContactStatus.CLAIMED, new Date(Date.now() - 1000)),
    );

    const claim = await service.claimAvailableContacts(1, 1);
    expect(claim.count).toBe(1);
    expect(claim.claimToken).not.toBeNull();

    const completed = await service.markClaimContacted(claim.claimToken!, 1);
    expect(completed.contactedCount).toBe(1);
    expect(
      await repository.findOneByOrFail({ id: claim.contacts[0].id }),
    ).toMatchObject({
      status: ContactStatus.CONTACTED,
      contactedByEmployeeId: 1,
    });
    expect((await service.claimAvailableContacts(1, 1)).count).toBe(0);
  });
  it('lists only contacts completed by the requested employee, newest first', async () => {
    const repository = db.getRepository(Contact);
    await repository.insert([
      { ...contact(1, 1, ContactStatus.CONTACTED), contactedByEmployeeId: 1, contactedAt: new Date('2026-01-01') },
      { ...contact(1, 2, ContactStatus.CONTACTED), contactedByEmployeeId: 1, contactedAt: new Date('2026-01-02') },
      { ...contact(2, 3, ContactStatus.CONTACTED), contactedByEmployeeId: 2, contactedAt: new Date('2026-01-03') },
      contact(1, 4),
    ]);
    const result = await service.listContacted(1);
    expect(result.total).toBe(2);
    expect(result.contacts.map(row => row.name)).toEqual(['Contact 2', 'Contact 1']);
    expect((await service.listContacted(1, 1, 'CONTACT 1')).total).toBe(1);
    expect((await service.listContacted(1, 1, '%')).total).toBe(0);
    expect((await service.listContacted(3)).contacts).toEqual([]);
  });

  it('paginates contacted history without repeating records', async () => {
    await db.getRepository(Contact).insert(Array.from({ length: 26 }, (_, index) => ({
      ...contact(1, index + 1, ContactStatus.CONTACTED), contactedByEmployeeId: 1, contactedAt: new Date('2026-01-01'),
    })));
    const first = await service.listContacted(1);
    const second = await service.listContacted(1, 2);
    expect(first.contacts).toHaveLength(25);
    expect(second.contacts).toHaveLength(1);
    expect(first.total).toBe(26);
    expect(first.contacts.some(row => row.id === second.contacts[0].id)).toBe(false);
  });

  it('rejects invalid history filters', async () => {
    await expect(service.listContacted(0)).rejects.toThrow('employeeId');
    await expect(service.listContacted(1, 0)).rejects.toThrow('page');
    await expect(service.listContacted(1, 1.5)).rejects.toThrow('page');
    await expect(service.listContacted(1, 1, 'a'.repeat(201))).rejects.toThrow('search');
  });

  it('can claim more than 500 after reconnecting to an existing daily quota row', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'contact-quota-'));
    const persistent = new DataSource({
      type: 'sqlite', database: join(directory, 'contacts.sqlite'),
      entities: [Contact, ShareDailyUsage], synchronize: true,
    });
    try {
      await persistent.initialize();
      const repository = persistent.getRepository(Contact);
      for (let offset = 0; offset < 1200; offset += 100) {
        await repository.insert(Array.from({ length: 100 }, (_, index) => contact(1, offset + index + 1)));
      }
      const first = await new ContactServiceService(repository).claimAvailableContacts(1, 500);
      expect(first.count).toBe(500);
      await persistent.destroy();
      await persistent.initialize();
      const second = await new ContactServiceService(persistent.getRepository(Contact)).claimAvailableContacts(1, 600);
      expect(second.count).toBe(600);
      expect(second.dailyUsage).toMatchObject({ used: 1100, remaining: 900 });
      expect(second.contacts.some(row => first.contacts.some(previous => previous.id === row.id))).toBe(false);
      expect(await persistent.getRepository(ShareDailyUsage).count()).toBe(1);
    } finally {
      if (persistent.isInitialized) await persistent.destroy();
      await rm(directory, { recursive: true, force: true });
    }
  });

});
