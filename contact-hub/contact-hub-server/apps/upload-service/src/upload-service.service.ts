import { Injectable, NotFoundException, PayloadTooLargeException, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import Busboy from 'busboy';
import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload, UploadStatus } from './entities/upload.entity.js';
import { UploadQueueService } from './queue/upload-queue.service.js';


const MAX_FILE_SIZE = 50 * 1024 * 1024;

@Injectable()
export class UploadServiceService {
  constructor(
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
    private readonly uploadQueue: UploadQueueService
  ){}

  getHello(): string {
    return 'Hello World!';
  }

  getHealth(){
    return {
      status: 'ok',
      success: true,
      message: 'The upload service is healthy'
    }
  }

  async uploadFile(req: Request, employeeId: number) {
    const contentType = req.headers['content-type'] ?? '';

    if (!contentType.startsWith('multipart/form-data')) {
      throw new BadRequestException(
        'Expected multipart/form-data',
      );
    }

    const uploadId = randomUUID();
    const directory = join(process.cwd(), 'storage', 'uploads');

    await mkdir(directory, { recursive: true });

    const filePath = join(directory, `${uploadId}.xlsx`);

    let fileCount = 0;
    let originalFileName = '';
    let fileSize = 0;
    let fileTooLarge = false;

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
        fields: 10,
        parts: 11,
      },
    });

    const writes: Promise<void>[] = [];

    try {
      await new Promise<void>((resolve, reject) => {
        busboy.on('file', (fieldName, stream, info) => {
          fileCount++;

          if (
            fieldName !== 'file' ||
            !info.filename?.toLowerCase().endsWith('.xlsx')
          ) {
            stream.resume();
            reject(new BadRequestException(
              'Expected an .xlsx file in the file field',
            ));
            return;
          }

          originalFileName = info.filename ?? '';

          stream.on('data', (chunk: Buffer) => {
            fileSize += chunk.length;
          });

          stream.on('limit', () => {
            fileTooLarge = true;
          });

          writes.push(
            pipeline(stream, createWriteStream(filePath)),
          );
        });

        busboy.on('filesLimit', () => {
          reject(new BadRequestException(
            'Only one file is allowed',
          ));
        });

        busboy.on('error', reject);
        req.on('error', reject);

        busboy.on('close', resolve);

        req.pipe(busboy);
      });

      await Promise.all(writes);

      if (fileTooLarge) {
        throw new PayloadTooLargeException(
          'File exceeds the 50 MB limit',
        );
      }

      if (fileCount !== 1) {
        throw new BadRequestException(
          'Exactly one Excel file is required',
        );
      }

      await this.uploadQueue.enqueueUpload({
        uploadId,
        employeeId,
        filePath
      })

      return {
        uploadId,
        originalFileName,
        fileSize,
        filePath,
        message: 'File stored successfully',
      };
    } catch (error) {
      await Promise.allSettled(writes);
      await rm(filePath, { force: true });
      throw error;
    }
  }

  async getUploadStatus(id: string) {
    const upload = await this.uploadRepository.findOneBy({
      id,
    });

    if(!upload) {
      throw new NotFoundException(
        `Upload ${id} not found`,
      );
    }

    return upload;
  }
}
