import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Contact, ContactStatus } from './entities/contact.entity.js';
import { ContactServiceService } from './contact-service.service.js';

function contact(employeeId: number, sourceRow: number, status = ContactStatus.AVAILABLE, claimExpiresAt: Date | null = null) {
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
      entities: [Contact],
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
    expect(first.contacts.every(row => row.status === ContactStatus.CLAIMED)).toBe(true);
    expect(second.count).toBe(1);
    expect(third.count).toBe(0);
    expect([...first.contacts, ...second.contacts].every(row => row.employeeId === 1)).toBe(true);
  });

  it('rejects a claim larger than 2000', async () => {
    await expect(service.claimAvailableContacts(1, 2001)).rejects.toThrow('between 1 and 2000');
  });

  it('makes an expired claim available for a new claim and records completed outreach', async () => {
    const repository = db.getRepository(Contact);
    await repository.insert(contact(1, 1, ContactStatus.CLAIMED, new Date(Date.now() - 1000)));

    const claim = await service.claimAvailableContacts(1, 1);
    expect(claim.count).toBe(1);
    expect(claim.claimToken).not.toBeNull();

    const completed = await service.markClaimContacted(claim.claimToken!, 1);
    expect(completed.contactedCount).toBe(1);
    expect(await repository.findOneByOrFail({ id: claim.contacts[0].id })).toMatchObject({
      status: ContactStatus.CONTACTED,
      contactedByEmployeeId: 1,
    });
    expect((await service.claimAvailableContacts(1, 1)).count).toBe(0);
  });
});
