import 'reflect-metadata';
import { DataSource } from 'typeorm';
import ExcelJS from 'exceljs';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Contact } from '../../../contact-service/src/entities/contact.entity.js';
import { Upload, UploadStatus } from '../../../upload-service/src/entities/upload.entity.js';
import { ExcelImportProcessor } from './excel-import.processor.js';

describe('Excel contact import', () => {
  let db: DataSource;
  let directory: string;
  let processor: ExcelImportProcessor;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'contact-import-'));
    db = await new DataSource({ type: 'sqlite', database: ':memory:',
      entities: [Contact, Upload], synchronize: true }).initialize();
    processor = new ExcelImportProcessor(db.getRepository(Upload), db.getRepository(Contact));
    await db.getRepository(Upload).insert({ id: 'test-upload', employeeId: 1,
      originalFileName: 'test.xlsx', storedFilePath: join(directory, 'test.xlsx'), fileSize: 1 });
  });

  afterEach(async () => {
    if (db?.isInitialized) await db.destroy();
    await rm(directory, { recursive: true, force: true });
  });

  async function run(headers: string[], rows: string[][]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contacts');
    worksheet.addRow(headers);
    rows.forEach(row => worksheet.addRow(row));
    const filePath = join(directory, 'test.xlsx');
    await workbook.xlsx.writeFile(filePath);
    const job = { name: 'process-excel', data: { uploadId: 'test-upload', employeeId: 1, filePath },
      attemptsMade: 0, opts: { attempts: 1 }, updateProgress: vi.fn().mockResolvedValue(undefined) };
    return processor.process(job as unknown as Parameters<ExcelImportProcessor['process']>[0]);
  }

  it('imports rows in batches, records rejected rows, and does not duplicate on replay', async () => {
    const headers = ['Name', 'Email', 'Phone', 'Interest'];
    const rows = Array.from({ length: 105 }, (_, i) => [`Person ${i}`, `person${i}@example.com`, '+919999999999', 'Music']);
    rows.push(['Invalid', 'not-an-email', '', '']);
    await run(headers, rows);
    expect(await db.getRepository(Contact).count()).toBe(105);
    expect(await db.getRepository(Contact).findOneByOrFail({ sourceRow: 2 })).toMatchObject({
      name: 'Person 0', email: 'person0@example.com', employeeId: 1, uploadId: 'test-upload', worksheetId: 1,
    });
    expect(await db.getRepository(Upload).findOneByOrFail({ id: 'test-upload' })).toMatchObject({
      status: UploadStatus.COMPLETED_WITH_ERRORS, totalRows: 106, succesfulRows: 105, failedRows: 1,
    });
    await run(headers, rows);
    expect(await db.getRepository(Contact).count()).toBe(105);
  });

  it('marks a fully valid import completed', async () => {
    await run(['Name', 'Email', 'Phone', 'Interest'], [['Alice', 'alice@example.com', '123', 'Books']]);
    expect(await db.getRepository(Upload).findOneByOrFail({ id: 'test-upload' })).toMatchObject({
      status: UploadStatus.COMPLETED, totalRows: 1, succesfulRows: 1, failedRows: 0,
    });
  });

  it('fails explicitly on missing headers without inserting contacts', async () => {
    await expect(run(['Wrong header'], [['Alice']])).rejects.toThrow('required headers');
    expect(await db.getRepository(Contact).count()).toBe(0);
    expect(await db.getRepository(Upload).findOneByOrFail({ id: 'test-upload' })).toMatchObject({ status: UploadStatus.FAILED });
  });

  it('rethrows database errors for retry without counting uncommitted rows as successful', async () => {
    vi.spyOn(db.getRepository(Contact), 'upsert').mockRejectedValueOnce(new Error('database unavailable'));
    await expect(run(['Name', 'Email', 'Phone', 'Interest'], [['Alice', 'alice@example.com', '', '']])).rejects.toThrow('database unavailable');
    expect(await db.getRepository(Upload).findOneByOrFail({ id: 'test-upload' })).toMatchObject({
      status: UploadStatus.FAILED, succesfulRows: 0, errorMeassage: 'database unavailable',
    });
  });
});
