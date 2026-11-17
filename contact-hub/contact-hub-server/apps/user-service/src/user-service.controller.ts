import { Body, Controller, Get, ParseIntPipe, Patch, Post, Param, Headers, BadRequestException } from '@nestjs/common';
import { UserServiceService, type CreateAccount } from './user-service.service.js';
@Controller('users')
export class UserServiceController {
  constructor(private readonly userService: UserServiceService) {}
  @Get() getHello() { return this.userService.getHello(); }
  @Get('health') getHealth() { return this.userService.getHealth(); }
  @Post('login') login(@Body() body: { email?: string; password?: string } = {}) { return this.userService.login(body?.email, body?.password); }
  @Post('employees') employees(@Body() body: { email?: string; password?: string } = {}) { return this.userService.login(body?.email, body?.password); }
  @Get('me') me(@Headers('authorization') auth?: string) { return this.userService.me(auth); }
  @Post('logout') logout(@Headers('authorization') auth?: string) { return this.userService.logout(auth); }
  @Patch('me/password') changePassword(@Headers('authorization') auth: string | undefined, @Body() body: { currentPassword?: string; password?: string } = {}) { return this.userService.changePassword(auth, body?.currentPassword, body?.password); }
  @Post('employee') async createEmployee(@Headers('authorization') auth: string | undefined, @Body() body: CreateAccount) {
    await this.userService.authenticate(auth, true);
    if (!body || typeof body !== 'object') throw new BadRequestException('Account details are required');
    return this.userService.createEmployee(body);
  }
  @Get('employee') async getEmployee(@Headers('authorization') auth?: string) { await this.userService.authenticate(auth, true); return this.userService.getEmployee(); }
  @Patch('employee/:id/password') async resetPassword(@Headers('authorization') auth: string | undefined, @Param('id', ParseIntPipe) id: number, @Body() body: { password?: string } = {}) {
    const actor = await this.userService.authenticate(auth, true);
    if (actor.employee_id === id) throw new BadRequestException('Use Change password to update your own password');
    return this.userService.resetPassword(id, body?.password);
  }
  @Patch('employee/:id') async updateEmployee(@Headers('authorization') auth: string | undefined, @Param('id', ParseIntPipe) id: number, @Body() body: { firstName?: string; lastName?: string } = {}) {
    await this.userService.authenticate(auth, true); return this.userService.updateUser(id, body ?? {});
  }
}
