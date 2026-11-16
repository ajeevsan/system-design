import { Body, Controller, Param, Post } from '@nestjs/common';
import { SharingServiceService } from './sharing-service.service.js';

interface ClaimContactsRequest {
  employeeId: number;
  limit?: number;
}

interface CompleteClaimRequest {
  employeeId: number;
}

@Controller('shares')
export class SharingServiceController {
  constructor(private readonly sharingServiceService: SharingServiceService) {}

  @Post('contacts/claim')
  claimContacts(@Body() body: ClaimContactsRequest | undefined) {
    return this.sharingServiceService.claimContacts(body ?? { employeeId: 0 });
  }

  @Post('claims/:claimToken/contacted')
  markClaimContacted(
    @Param('claimToken') claimToken: string,
    @Body() body: CompleteClaimRequest | undefined,
  ) {
    return this.sharingServiceService.markClaimContacted(
      claimToken,
      body ?? { employeeId: 0 },
    );
  }
}
