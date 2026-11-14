import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiGatewayService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth() {
    return {
      sucess: true,
      status: 'ok',
      message: 'The api-gateway is healthy.'
    }
  }
}
