import {
  Controller,
  Post,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Get
} from '@nestjs/common';

import type { Request } from 'express';
import { UploadServiceService } from './upload-service.service.js';

@Controller('uploads')
export class UploadServiceController {
  constructor(private readonly uploadServiceService: UploadServiceService) {}

  @Get()
  getHello(): string {
    return this.uploadServiceService.getHello();
  }

  @Get('health')
  getHealth(){
    return this.uploadServiceService.getHealth()
  }

  @Post(':employeeId')
  @HttpCode(HttpStatus.ACCEPTED)
  uploadFile(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Req() req: Request,
  ) {
    return this.uploadServiceService.uploadFile(req, employeeId);
  }

  @Get(':id')
  getUploadStatus(@Param('id') id: string) {
    return this.uploadServiceService.getUploadStatus(id);
  }
}
