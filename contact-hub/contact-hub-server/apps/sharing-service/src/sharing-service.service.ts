import { Injectable } from '@nestjs/common';

@Injectable()
export class SharingServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
