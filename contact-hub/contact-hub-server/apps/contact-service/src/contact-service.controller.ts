import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ContactServiceService } from './contact-service.service.js';

interface ClaimContactsRequest {
  employeeId: number;
  limit?: number;
}

interface CompleteClaimRequest {
  employeeId: number;
}

@Controller()
export class ContactServiceController {
  constructor(private readonly contactServiceService: ContactServiceService) {}

  @Get()
  getHello(): string {
    return this.contactServiceService.getHello();
  }

  @Get('contacts/contacted')
  listContacted(
    @Query('employeeId') employeeId?: string,
    @Query('page') page?: string,
    @Query('search') search?: string,
  ) {
    return this.contactServiceService.listContacted(Number(employeeId), page === undefined ? 1 : Number(page), search ?? '');
  }

  @Post('contacts/claim')
    claimContacts(@Body() body: ClaimContactsRequest | undefined) {
      return this.contactServiceService.claimAvailableContacts(body?.employeeId ?? 0, body?.limit);
  }

  @Post('contacts/claims/:claimToken/contacted')
  markClaimContacted(
    @Param('claimToken') claimToken: string,
     @Body() body: CompleteClaimRequest | undefined,
  ) {
     return this.contactServiceService.markClaimContacted(claimToken, body?.employeeId ?? 0);
  }
}
