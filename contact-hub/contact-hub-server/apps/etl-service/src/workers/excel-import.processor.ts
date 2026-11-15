import { Contact, ContactStatus } from '../../../contact-service/src/entities/contact.entity.js';

import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import ExcelJS from 'exceljs';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Upload, UploadStatus } from '../../../upload-service/src/entities/upload.entity.js';
import { Repository } from 'typeorm';

interface ExcelImportJob {
  uploadId: string;
  employeeId: number;
  filePath: string;
}

@Injectable()
@Processor('contact-imports', {
  concurrency: 1,
})
export class ExcelImportProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
    @InjectRepository(Contact, 'contacts')
    private readonly contactRepository: Repository<Contact>,
  ) {
    super();
  }
  private readonly logger = new Logger(
    ExcelImportProcessor.name,
  );

  async process(job: Job<ExcelImportJob>): Promise<{
    uploadId: string;
    totalRows: number;
  }> {
    const { uploadId, filePath } = job.data;

    if (job.name !== 'process-excel') {
      throw new Error(`Unsupported job: ${job.name}`);
    }

    const started = await this.uploadRepository.update(uploadId, {
      status: UploadStatus.PROCESSING,
      totalRows: 0,
      succesfulRows: 0,
      failedRows: 0,
      errorMeassage: null,
      completedAt: null,
    });

    if (!started.affected) {
      throw new Error(`Upload ${uploadId} not found`);
    }

    const startedAt = Date.now();
    let totalRows = 0;
    let succesfulRows = 0;
    let failedRows = 0;
    let batch: Partial<Contact>[] = [];
    const flush = async () => {
      if (batch.length === 0) return;
      await this.contactRepository.createQueryBuilder()
        .insert()
        .into(Contact)
        .values(batch)
        .orIgnore()
        .execute();
      succesfulRows += batch.length;
      batch = [];
      await this.uploadRepository.update(uploadId, { totalRows, succesfulRows, failedRows });
    };

    this.logger.log(`Starting ETL for upload ${uploadId}`);

    try {
      // Fail explicitly if an old job references a removed or unreadable file.
      await access(filePath, constants.R_OK);

      const workbook = new ExcelJS.stream.xlsx.WorkbookReader(
        filePath,
        {
          sharedStrings: 'cache',
          hyperlinks: 'ignore',
          styles: 'ignore',
          worksheets: 'emit',
        },
      );

      let worksheetId = 0;
      for await (const worksheet of workbook) {
        worksheetId++;
        let columns: Record<string, number> | undefined;
        for await (const row of worksheet) {
          if (!row.hasValues) continue;
          if (!columns) {
            columns = {};
            row.eachCell((cell, index) => {
              columns![cell.text.trim().toLowerCase()] = index;
            });
            if (!['name', 'email', 'phone', 'interest'].every(key => columns![key])) {
              throw new Error(`Worksheet ${worksheetId}: required headers are Name, Email, Phone, Interest`);
            }
            continue;
          }
          totalRows++;
          const name = row.getCell(columns.name).text.trim();
          const email = row.getCell(columns.email).text.trim().toLowerCase();
          const phone = row.getCell(columns.phone).text.trim();
          const interest = row.getCell(columns.interest).text.trim();
          if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            failedRows++;
            continue;
          }
          batch.push({ uploadId, employeeId: job.data.employeeId, worksheetId,
            sourceRow: row.number, name, email, phone, interest,
            status: ContactStatus.IMPORTING });
          // Stay below SQLite's parameter limit and bound memory usage.
          if (batch.length >= 50) await flush();
        }
      }
      await flush();

      await job.updateProgress(100);

      await this.uploadRepository.update(uploadId, {
        status: failedRows > 0 ? UploadStatus.COMPLETED_WITH_ERRORS : UploadStatus.COMPLETED,
        totalRows,
        succesfulRows,
        failedRows,
        errorMeassage: null,
        completedAt: new Date(),
      });

      await this.contactRepository.update(
        { uploadId, status: ContactStatus.IMPORTING },
        { status: ContactStatus.AVAILABLE },
      );

      this.logger.log(
        `ETL finished for ${uploadId}: ${totalRows} rows in ${
          Date.now() - startedAt
        } ms`,
      );

      return { uploadId, totalRows };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      const finalAttempt =
        job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

      await this.uploadRepository.update(uploadId, {
        status: finalAttempt
          ? UploadStatus.FAILED
          : UploadStatus.PENDING,
        totalRows,
        succesfulRows,
        failedRows,
        errorMeassage: message,
        completedAt: finalAttempt ? new Date() : null,
      });

      this.logger.error(`ETL failed for ${uploadId}: ${message}`);

      // Let BullMQ handle the configured retries.
      throw error;
    }
  }
}
