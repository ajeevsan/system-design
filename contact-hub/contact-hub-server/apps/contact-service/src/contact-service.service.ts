import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { Contact, ContactStatus } from './entities/contact.entity.js';
import { ShareDailyUsage } from './entities/share-daily-usage.entity.js';

const MAX_CLAIM_SIZE = 2000;
const DAILY_SHARE_LIMIT = 2000;
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

  async claimAvailableContacts(
    employeeId: number,
    requestedLimit = MAX_CLAIM_SIZE,
  ) {
    if (!Number.isInteger(employeeId) || employeeId < 1) {
      throw new BadRequestException('employeeId must be a positive integer');
    }
    if (
      !Number.isInteger(requestedLimit) ||
      requestedLimit < 1 ||
      requestedLimit > MAX_CLAIM_SIZE
    ) {
      throw new BadRequestException(
        `limit must be an integer between 1 and ${MAX_CLAIM_SIZE}`,
      );
    }

    const now = new Date();
    const quotaDate = now.toISOString().slice(0, 10);
    const claimExpiresAt = new Date(now.getTime() + CLAIM_TTL_MS);
    const claimToken = randomUUID();

    const contacts = await this.contactRepository.manager.transaction(
      async (manager) => {
        const repository = manager.getRepository(Contact);
        const usageRepository = manager.getRepository(ShareDailyUsage);

        await usageRepository
          .createQueryBuilder()
          .insert()
          .values({ employeeId, quotaDate, contactsShared: 0 })
          .orIgnore()
          .execute();
        const usage = await usageRepository.findOneByOrFail({
          employeeId,
          quotaDate,
        });
        const remaining = DAILY_SHARE_LIMIT - usage.contactsShared;
        if (remaining <= 0) {
          throw new HttpException(
            `Daily contact share limit of ${DAILY_SHARE_LIMIT} reached`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        const candidates = await repository
          .createQueryBuilder('contact')
          .select('contact.id', 'id')
          .where('contact.employeeId = :employeeId', { employeeId })
          .andWhere(
            '(contact.status = :available OR (contact.status = :claimed AND contact.claimExpiresAt <= :now))',
            {
              available: ContactStatus.AVAILABLE,
              claimed: ContactStatus.CLAIMED,
              now,
            },
          )
          .orderBy('contact.id', 'ASC')
          .limit(Math.min(requestedLimit, remaining))
          .getRawMany<{ id: number }>();

        const ids = candidates.map((candidate) => Number(candidate.id));
        if (ids.length === 0) return { contacts: [], usage };

        await repository
          .createQueryBuilder()
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
            {
              available: ContactStatus.AVAILABLE,
              claimed: ContactStatus.CLAIMED,
              now,
            },
          )
          .execute();

        const claimedContacts = await repository.find({
          where: { claimToken },
          order: { id: 'ASC' },
        });
        const claimedCount = claimedContacts.length;
        if (claimedCount > 0) {
          const quotaUpdate = await usageRepository
            .createQueryBuilder()
            .update(ShareDailyUsage)
            .set({ contactsShared: () => '"contactsShared" + :claimedCount' })
            .where('"employeeId" = :employeeId AND "quotaDate" = :quotaDate', {
              employeeId,
              quotaDate,
            })
            .andWhere('"contactsShared" + :claimedCount <= :dailyLimit', {
              claimedCount,
              dailyLimit: DAILY_SHARE_LIMIT,
            })
            .execute();

          if (quotaUpdate.affected !== 1) {
            throw new HttpException(
              `Daily contact share limit of ${DAILY_SHARE_LIMIT} reached`,
              HttpStatus.TOO_MANY_REQUESTS,
            );
          }
        }

        const updatedUsage = await usageRepository.findOneByOrFail({
          employeeId,
          quotaDate,
        });
        return { contacts: claimedContacts, usage: updatedUsage };
      },
    );

    const claimedContacts = contacts.contacts;
    return {
      claimToken: claimedContacts.length > 0 ? claimToken : null,
      claimExpiresAt: claimedContacts.length > 0 ? claimExpiresAt : null,
      count: claimedContacts.length,
      contacts: claimedContacts,
      dailyUsage: {
        limit: DAILY_SHARE_LIMIT,
        used: contacts.usage.contactsShared,
        remaining: DAILY_SHARE_LIMIT - contacts.usage.contactsShared,
        quotaDate,
      },
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
