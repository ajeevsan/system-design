import { Injectable } from '@nestjs/common';

@Injectable()
export class EtlServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
