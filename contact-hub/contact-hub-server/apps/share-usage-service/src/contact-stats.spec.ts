import { contactBuckets, periodStart, periodTotal, dateKey, statsRange } from '../../../../web-app/lib/contact-stats';

describe('contact statistics calendar aggregation', () => {
  it('starts weeks on Monday, including across a year boundary', () => {
    expect(dateKey(periodStart('2027-01-03', 'weekly'))).toBe('2026-12-28');
    expect(dateKey(periodStart('2027-01-04', 'weekly'))).toBe('2027-01-04');
  });
  it('fills missing dates with zero and excludes dates after the selected day', () => {
    const rows = [{ date: '2026-11-16', contactsUsed: 3 }, { date: '2026-11-18', contactsUsed: 99 }];
    const buckets = contactBuckets(rows, '2026-11-17', 'daily');
    expect(buckets).toHaveLength(14);
    expect(buckets.at(-1)).toMatchObject({ date: '2026-11-17', count: 0 });
    expect(periodTotal(rows, '2026-11-17', 'weekly')).toBe(3);
  });
  it('handles leap days and month boundaries without counting the next month', () => {
    const rows = [{ date: '2024-02-29', contactsUsed: 2 }, { date: '2024-03-01', contactsUsed: 7 }];
    const buckets = contactBuckets(rows, '2024-03-01', 'monthly');
    expect(buckets.at(-2)).toEqual({ date: '2024-02-01', end: '2024-02-29', count: 2 });
    expect(buckets.at(-1)?.count).toBe(7);
    expect(periodTotal(rows, '2024-03-01', 'monthly')).toBe(7);
    expect(statsRange('2024-03-01')).toEqual({ from: '2023-04-01', to: '2024-03-01' });
  });
});
