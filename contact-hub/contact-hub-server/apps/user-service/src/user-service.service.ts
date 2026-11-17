import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, ForbiddenException, ConflictException, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity.js';
import { UserSession } from './entities/user-session.entity.js';
import { Repository } from 'typeorm';
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export interface CreateAccount { firstName: string; lastName: string; email: string; phone: string; password: string; role?: string }
@Injectable()
export class UserServiceService implements OnModuleInit {
  constructor(@InjectRepository(Employee) private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(UserSession) private readonly sessions: Repository<UserSession>) {}
  getHello() { return 'Hello World!'; }
  getHealth() { return { service: 'user-service', status: 'ok' }; }
  async onModuleInit() {
    const email = process.env.INITIAL_ADMIN_EMAIL;
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    if (!email || !password || await this.employeeRepository.existsBy({ role: 'ADMIN' })) return;
    this.validatePassword(password);
    const normalized = this.normalizeEmail(email);
    const existing = await this.employeeRepository.createQueryBuilder('employee').where('lower(employee.email) = :email', { email: normalized }).getOne();
    const account = existing ?? this.employeeRepository.create({ firstName: 'System', lastName: 'Admin', email: normalized, phone: process.env.INITIAL_ADMIN_PHONE ?? 'initial-admin', status: 'ACTIVE' });
    account.role = 'ADMIN'; account.passwordHash = await this.hash(password);
    await this.employeeRepository.save(account);
  }
  private normalizeEmail(value: unknown) {
    if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new BadRequestException('Enter a valid email address');
    return value.trim().toLowerCase();
  }
  private validatePassword(value: unknown): asserts value is string {
    if (typeof value !== 'string' || value.length < 12 || value.length > 128) throw new BadRequestException('Password must contain 12 to 128 characters');
  }
  private async hash(password: string) {
    const salt = randomBytes(16).toString('hex');
    const key = await derive(password, salt, 64) as Buffer;
    return `${salt}:${key.toString('hex')}`;
  }
  private async matches(password: string, hash: string | null) {
    if (!hash) return false;
    const [salt, expected] = hash.split(':');
    if (!salt || !expected) return false;
    const key = await derive(password, salt, 64) as Buffer;
    const target = Buffer.from(expected, 'hex');
    return target.length === key.length && timingSafeEqual(key, target);
  }
  private publicAccount(account: Employee) {
    return { id: account.employee_id, firstName: account.firstName, lastName: account.lastName, email: account.email, phone: account.phone, role: account.role.toLowerCase(), status: account.status };
  }
  async login(email: unknown, password: unknown) {
    const normalized = this.normalizeEmail(email);
    if (typeof password !== 'string' || password.length > 128) throw new UnauthorizedException('Invalid email or password');
    const account = await this.employeeRepository.createQueryBuilder('employee').addSelect('employee.passwordHash').where('lower(employee.email) = :email', { email: normalized }).getOne();
    if (!account || account.status !== 'ACTIVE' || !await this.matches(password, account.passwordHash)) throw new UnauthorizedException('Invalid email or password');
    const accessToken = randomBytes(32).toString('hex');
    await this.sessions.save({ tokenHash: createHash('sha256').update(accessToken).digest('hex'), employeeId: account.employee_id, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) });
    return { success: true, user: this.publicAccount(account), accessToken };
  }
  async authenticate(authorization?: string, admin = false) {
    const token = authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!token) throw new UnauthorizedException('Sign in again to continue');
    const session = await this.sessions.findOneBy({ tokenHash: createHash('sha256').update(token).digest('hex') });
    if (!session || session.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException('Your session has expired. Sign in again');
    const account = await this.employeeRepository.findOneBy({ employee_id: session.employeeId, status: 'ACTIVE' });
    if (!account) throw new UnauthorizedException('Account is unavailable');
    if (admin && account.role !== 'ADMIN') throw new ForbiddenException('Administrator access required');
    return account;
  }
  async me(authorization?: string) { return this.publicAccount(await this.authenticate(authorization)); }
  async createEmployee(data: CreateAccount) {
    const email = this.normalizeEmail(data.email); this.validatePassword(data.password);
    for (const value of [data.firstName, data.lastName, data.phone]) if (typeof value !== 'string' || !value.trim() || value.length > 100) throw new BadRequestException('Name and phone fields are required (maximum 100 characters)');
    if (data.role !== undefined && typeof data.role !== 'string') throw new BadRequestException('Invalid account role');
    const role = data.role?.toUpperCase() ?? 'EMPLOYEE';
    if (!['ADMIN', 'EMPLOYEE'].includes(role)) throw new BadRequestException('Invalid account role');
    if (await this.employeeRepository.createQueryBuilder('employee').where('lower(employee.email) = :email OR employee.phone = :phone', { email, phone: data.phone.trim() }).getExists()) throw new ConflictException('An account with this email or phone already exists');
    const account = this.employeeRepository.create({ firstName: data.firstName.trim(), lastName: data.lastName.trim(), email, phone: data.phone.trim(), role, status: 'ACTIVE', passwordHash: await this.hash(data.password) });
    try { return this.publicAccount(await this.employeeRepository.save(account)); }
    catch (error) { if ((error as { code?: string }).code === 'SQLITE_CONSTRAINT') throw new ConflictException('An account with this email or phone already exists'); throw error; }
  }
  async getEmployee() { return (await this.employeeRepository.find({ order: { employee_id: 'DESC' } })).map(account => this.publicAccount(account)); }
  async resetPassword(id: number, password: unknown) {
    this.validatePassword(password);
    if (!await this.employeeRepository.existsBy({ employee_id: id })) throw new NotFoundException('Account not found');
    await this.employeeRepository.manager.transaction(async manager => {
      await manager.update(Employee, { employee_id: id }, { passwordHash: await this.hash(password) });
      await manager.delete(UserSession, { employeeId: id });
    });
    return { success: true };
  }
  async changePassword(authorization: string | undefined, current: unknown, next: unknown) {
    const account = await this.authenticate(authorization);
    this.validatePassword(next);
    if (typeof current !== 'string' || current.length > 128) throw new BadRequestException('Current password is required');
    const stored = await this.employeeRepository.createQueryBuilder('employee').addSelect('employee.passwordHash').where('employee.employee_id = :id', { id: account.employee_id }).getOneOrFail();
    if (!await this.matches(current, stored.passwordHash)) throw new BadRequestException('Current password is incorrect');
    return this.resetPassword(account.employee_id, next);
  }
  async logout(authorization?: string) {
    const token = authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (token) await this.sessions.delete({ tokenHash: createHash('sha256').update(token).digest('hex') });
    return { success: true };
  }
  async updateUser(id: number, data: { firstName?: string; lastName?: string }) {
    const account = await this.employeeRepository.findOneBy({ employee_id: id });
    if (!account) throw new NotFoundException('Account not found');
    if (data.firstName === undefined && data.lastName === undefined) throw new BadRequestException('Provide a name field');
    for (const field of ['firstName', 'lastName'] as const) if (data[field] !== undefined) {
      if (typeof data[field] !== 'string' || !data[field]!.trim() || data[field]!.length > 100) throw new BadRequestException('Invalid name');
      account[field] = data[field]!.trim();
    }
    return this.publicAccount(await this.employeeRepository.save(account));
  }
}
