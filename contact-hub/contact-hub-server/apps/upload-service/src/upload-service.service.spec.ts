import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Readable } from 'node:stream';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Request } from 'express';
import { UploadServiceService } from './upload-service.service.js';
import { Upload, UploadStatus } from './entities/upload.entity.js';
import { UploadQuota } from './entities/upload-quota.entity.js';
import type { UploadQueueService } from './queue/upload-queue.service.js';

function request(filename = 'contacts.xlsx'): Request {
  const stream = Readable.from([
    Buffer.from(`--test-boundary\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\nexample\r\n--test-boundary--\r\n`),
  ]);
  return Object.assign(stream, {
    headers: { 'content-type': 'multipart/form-data; boundary=test-boundary' },
  }) as unknown as Request;
}

describe('upload persistence', () => {
  let db: DataSource;
  let directory: string;
  let service: UploadServiceService;
  let enqueue: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'upload-test-'));
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    db = await new DataSource({
      type: 'sqlite', database: ':memory:',
      entities: [Upload, UploadQuota], synchronize: true,
    }).initialize();
    enqueue = vi.fn().mockResolvedValue({});
    service = new UploadServiceService(
      db.getRepository(Upload),
      { enqueueUpload: enqueue } as unknown as UploadQueueService,
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (db?.isInitialized) await db.destroy();
    await rm(directory, { recursive: true, force: true });
  });

  it('persists metadata before enqueueing and increments one daily quota per employee', async () => {
    enqueue.mockImplementation(async ({ uploadId }) => {
      expect(await service.getUploadStatus(uploadId)).toMatchObject({ status: UploadStatus.PENDING });
    });
    const first = await service.uploadFile(request(), 1);
    await service.uploadFile(request(), 1);
    await service.uploadFile(request(), 2);
    expect(await service.getUploadStatus(first.uploadId)).toMatchObject({
      employeeId: 1, originalFileName: 'contacts.xlsx', fileSize: 7,
      storedFilePath: first.filePath,
    });
    await access(first.filePath);
    expect(await db.getRepository(Upload).count()).toBe(3);
    expect(await db.getRepository(UploadQuota).find({ order: { employeeId: 'ASC' } })).toMatchObject([
      { employeeId: 1, quotaDate: new Date().toISOString().slice(0, 10), uploadCount: 2 },
      { employeeId: 2, uploadCount: 1 },
    ]);
  });

  it('records queue failure and removes the file', async () => {
    enqueue.mockRejectedValue(new Error('Redis unavailable'));
    await expect(service.uploadFile(request(), 1)).rejects.toThrow('Upload could not be queued');
    const upload = await db.getRepository(Upload).findOneByOrFail({ employeeId: 1 });
    expect(upload).toMatchObject({ status: UploadStatus.QUEUE_FAILED, errorMeassage: 'Redis unavailable' });
    await expect(access(upload.storedFilePath)).rejects.toThrow();
    expect(await db.getRepository(UploadQuota).findOneBy({ employeeId: 1 })).toMatchObject({ uploadCount: 1 });
  });

  it('rolls back upload metadata if the quota write fails', async () => {
    await db.query('DROP TABLE upload_quotas');
    await expect(service.uploadFile(request(), 1)).rejects.toThrow();
    expect(await db.getRepository(Upload).count()).toBe(0);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('rejects invalid files without writing records or queueing', async () => {
    await expect(service.uploadFile(request('contacts.csv'), 1)).rejects.toThrow('Expected an .xlsx file');
    expect(await db.getRepository(Upload).count()).toBe(0);
    expect(await db.getRepository(UploadQuota).count()).toBe(0);
    expect(enqueue).not.toHaveBeenCalled();
  });
});
