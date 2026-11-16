import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

interface ClaimContactsRequest {
  employeeId: number;
  limit?: number;
}

interface CompleteClaimRequest {
  employeeId: number;
}

@Injectable()
export class SharingServiceService {
  async claimContacts(body: ClaimContactsRequest): Promise<unknown> {
    return this.forward('/contacts/claim', body);
  }

  async markClaimContacted(
    claimToken: string,
    body: CompleteClaimRequest,
  ): Promise<unknown> {
    return this.forward(
      `/contacts/claims/${encodeURIComponent(claimToken)}/contacted`,
      body,
    );
  }

  private async forward(path: string, body: object): Promise<unknown> {
    const contactServiceUrl =
      process.env.CONTACT_SERVICE_URL ?? 'http://127.0.0.1:3005';
    let response: Response;

    try {
      response = await fetch(`${contactServiceUrl}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new ServiceUnavailableException('Contact service is unavailable', {
        cause: error,
      });
    }

    const result: unknown = await response.json();
    if (!response.ok) {
      throw new HttpException(
        typeof result === 'object' && result !== null ? result : String(result),
        response.status,
      );
    }
    return result;
  }
}
