
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class UploadQueueService {
  constructor(
    @InjectQueue('contact-imports')
    private readonly importQueue: Queue,
  ) {}

  async enqueueUpload(data: {
    uploadId: string;
    employeeId: number;
    filePath: string;
  }) {
    return this.importQueue.add(
      'process-excel',
      data,
      {
        jobId: data.uploadId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
  }
}
