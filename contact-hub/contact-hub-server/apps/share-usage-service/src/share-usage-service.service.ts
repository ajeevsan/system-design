import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface DailyShareRow {
  employeeId: number;
  date: string;
  contactsShared: number;
}

interface DailyContactRow {
  employeeId: number;
  date: string;
  contactsUsed: number;
}

interface CountRow {
  employeeId: number;
  status: string;
  count: number;
}

interface InterestRow {
  employeeId: number;
  interest: string;
  contactsUsed: number;
}

interface TodayUsageRow {
  employeeId: number;
  contactsShared: number;
}

const DAILY_SHARE_LIMIT = 2000;

@Injectable()
export class ShareUsageServiceService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getUsage(employeeId?: string, from?: string, to?: string) {
    const parsedEmployeeId =
      employeeId === undefined ? undefined : Number(employeeId);
    if (
      parsedEmployeeId !== undefined &&
      (!Number.isInteger(parsedEmployeeId) || parsedEmployeeId < 1)
    ) {
      throw new BadRequestException('employeeId must be a positive integer');
    }
    this.validateDateRange(from, to);

    const quotaFilter = this.buildFilter(
      'quotaDate',
      parsedEmployeeId,
      from,
      to,
    );
    const contactFilter = this.buildFilter(
      'date(contactedAt)',
      parsedEmployeeId,
      from,
      to,
    );
    const employeeFilter =
      parsedEmployeeId === undefined ? '' : ' WHERE employeeId = ?';
    const employeeParameters =
      parsedEmployeeId === undefined ? [] : [parsedEmployeeId];

    const [shareRows, contactedRows, statusRows, interestRows, todayRows] =
      await Promise.all([
        this.dataSource.query(
          `SELECT employeeId, quotaDate AS date, contactsShared FROM share_daily_usage${quotaFilter.sql} ORDER BY quotaDate`,
          quotaFilter.parameters,
        ) as Promise<DailyShareRow[]>,
        this.dataSource.query(
          `SELECT employeeId, date(contactedAt) AS date, COUNT(*) AS contactsUsed
         FROM contacts${contactFilter.sql}${contactFilter.sql ? ' AND' : ' WHERE'} status = 'CONTACTED'
           AND contactedAt IS NOT NULL
         GROUP BY employeeId, date(contactedAt)
         ORDER BY date(contactedAt)`,
          contactFilter.parameters,
        ) as Promise<DailyContactRow[]>,
        this.dataSource.query(
          `SELECT employeeId, status, COUNT(*) AS count
         FROM contacts${employeeFilter}
         GROUP BY employeeId, status`,
          employeeParameters,
        ) as Promise<CountRow[]>,
        this.dataSource.query(
          `SELECT employeeId, interest, COUNT(*) AS contactsUsed
         FROM contacts${contactFilter.sql}${contactFilter.sql ? ' AND' : ' WHERE'} status = 'CONTACTED'
           AND contactedAt IS NOT NULL
         GROUP BY employeeId, interest
         ORDER BY contactsUsed DESC, interest ASC`,
          contactFilter.parameters,
        ) as Promise<InterestRow[]>,
        this.dataSource.query(
          `SELECT employeeId, contactsShared FROM share_daily_usage WHERE quotaDate = ?${parsedEmployeeId === undefined ? '' : ' AND employeeId = ?'}`,
          [new Date().toISOString().slice(0, 10), ...employeeParameters],
        ) as Promise<TodayUsageRow[]>,
      ]);

    const employeeIds = new Set<number>();
    for (const row of [
      ...shareRows,
      ...contactedRows,
      ...statusRows,
      ...interestRows,
      ...todayRows,
    ]) {
      employeeIds.add(Number(row.employeeId));
    }
    if (parsedEmployeeId !== undefined) employeeIds.add(parsedEmployeeId);

    const users = [...employeeIds]
      .sort((a, b) => a - b)
      .map((id) => {
        const daily = new Map<
          string,
          { contactsShared: number; contactsUsed: number }
        >();
        for (const row of shareRows.filter(
          (item) => Number(item.employeeId) === id,
        )) {
          daily.set(row.date, {
            contactsShared: Number(row.contactsShared),
            contactsUsed: 0,
          });
        }
        for (const row of contactedRows.filter(
          (item) => Number(item.employeeId) === id,
        )) {
          const metrics = daily.get(row.date) ?? {
            contactsShared: 0,
            contactsUsed: 0,
          };
          metrics.contactsUsed = Number(row.contactsUsed);
          daily.set(row.date, metrics);
        }

        const statusCount = (status: string) =>
          Number(
            statusRows.find(
              (row) => Number(row.employeeId) === id && row.status === status,
            )?.count ?? 0,
          );
        const contactsShared = shareRows
          .filter((row) => Number(row.employeeId) === id)
          .reduce((sum, row) => sum + Number(row.contactsShared), 0);
        const contactsUsed = contactedRows
          .filter((row) => Number(row.employeeId) === id)
          .reduce((sum, row) => sum + Number(row.contactsUsed), 0);
        const todayShared = Number(
          todayRows.find((row) => Number(row.employeeId) === id)
            ?.contactsShared ?? 0,
        );

        return {
          employeeId: id,
          contactsShared,
          contactsUsed,
          contactsWaiting: statusCount('CLAIMED'),
          contactsAvailable: statusCount('AVAILABLE'),
          remainingToday: Math.max(0, DAILY_SHARE_LIMIT - todayShared),
          daily: [...daily.entries()]
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, counts]) => ({ date, ...counts })),
          interests: interestRows
            .filter((row) => Number(row.employeeId) === id)
            .map((row) => ({
              interest: row.interest,
              contactsUsed: Number(row.contactsUsed),
            })),
        };
      });

    return { from: from ?? null, to: to ?? null, users };
  }

  private validateDateRange(from?: string, to?: string): void {
    for (const [label, value] of [
      ['from', from],
      ['to', to],
    ] as const) {
      if (
        value !== undefined &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
          new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value)
      ) {
        throw new BadRequestException(
          `${label} must be a valid date in YYYY-MM-DD format`,
        );
      }
    }
    if (from && to && from > to) {
      throw new BadRequestException('from must be on or before to');
    }
  }

  private buildFilter(
    dateColumn: string,
    employeeId?: number,
    from?: string,
    to?: string,
  ): { sql: string; parameters: (number | string)[] } {
    const conditions: string[] = [];
    const parameters: (number | string)[] = [];
    if (employeeId !== undefined) {
      conditions.push('employeeId = ?');
      parameters.push(employeeId);
    }
    if (from) {
      conditions.push(`${dateColumn} >= ?`);
      parameters.push(from);
    }
    if (to) {
      conditions.push(`${dateColumn} <= ?`);
      parameters.push(to);
    }
    return {
      sql: conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '',
      parameters,
    };
  }
}
