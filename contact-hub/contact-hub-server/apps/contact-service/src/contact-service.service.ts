import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { Contact, ContactStatus } from './entities/contact.entity.js';

const MAX_CLAIM_SIZE = 2000;
const CLAIM_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class ContactServiceService {
  constructor(
    @InjectRepository(Contact, 'contacts')
    private readonly contactRepository: Repository<Contact>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async claimAvailableContacts(employeeId: number, requestedLimit = MAX_CLAIM_SIZE) {
    if (!Number.isInteger(employeeId) || employeeId < 1) {
      throw new BadRequestException('employeeId must be a positive integer');
    }
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_CLAIM_SIZE) {
      throw new BadRequestException(`limit must be an integer between 1 and ${MAX_CLAIM_SIZE}`);
    }

    const now = new Date();
    const claimExpiresAt = new Date(now.getTime() + CLAIM_TTL_MS);
    const claimToken = randomUUID();

    const contacts = await this.contactRepository.manager.transaction(async manager => {
      const repository = manager.getRepository(Contact);
      const candidates = await repository.createQueryBuilder('contact')
        .select('contact.id', 'id')
        .where('contact.employeeId = :employeeId', { employeeId })
        .andWhere(
          '(contact.status = :available OR (contact.status = :claimed AND contact.claimExpiresAt <= :now))',
          { available: ContactStatus.AVAILABLE, claimed: ContactStatus.CLAIMED, now },
        )
        .orderBy('contact.id', 'ASC')
        .limit(requestedLimit)
        .getRawMany<{ id: number }>();

      const ids = candidates.map(candidate => Number(candidate.id));
      if (ids.length === 0) return [];

      await repository.createQueryBuilder()
        .update(Contact)
        .set({
          status: ContactStatus.CLAIMED,
          claimToken,
          claimedByEmployeeId: employeeId,
          claimedAt: now,
          claimExpiresAt,
        })
        .where('id IN (:...ids)', { ids })
        .andWhere(
          '(status = :available OR (status = :claimed AND claimExpiresAt <= :now))',
          { available: ContactStatus.AVAILABLE, claimed: ContactStatus.CLAIMED, now },
        )
        .execute();

      return repository.find({ where: { claimToken }, order: { id: 'ASC' } });
    });

    return {
      claimToken: contacts.length > 0 ? claimToken : null,
      claimExpiresAt: contacts.length > 0 ? claimExpiresAt : null,
      count: contacts.length,
      contacts,
    };
  }

  async markClaimContacted(claimToken: string, employeeId: number) {
    if (!Number.isInteger(employeeId) || employeeId < 1) {
      throw new BadRequestException('employeeId must be a positive integer');
    }

    const result = await this.contactRepository.update(
      {
        claimToken,
        status: ContactStatus.CLAIMED,
        claimedByEmployeeId: employeeId,
      },
      {
        status: ContactStatus.CONTACTED,
        contactedByEmployeeId: employeeId,
        contactedAt: new Date(),
        claimToken: null,
        claimExpiresAt: null,
      },
    );

    return { claimToken, contactedCount: result.affected ?? 0 };
  }
}
