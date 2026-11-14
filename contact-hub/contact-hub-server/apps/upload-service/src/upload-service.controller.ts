import { Controller, Get } from '@nestjs/common';
import { UploadServiceService } from './upload-service.service.js';

@Controller('uplaod')
export class UploadServiceController {
  constructor(private readonly uploadServiceService: UploadServiceService) {}

  @Get()
  getHello(): string {
    return this.uploadServiceService.getHello();
  }
}
