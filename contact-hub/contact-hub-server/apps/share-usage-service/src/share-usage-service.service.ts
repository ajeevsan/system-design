import { Injectable } from '@nestjs/common';

@Injectable()
export class ShareUsageServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
