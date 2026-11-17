import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Employee } from './entities/employee.entity.js';
import { UserSession } from './entities/user-session.entity.js';
import { UserServiceService } from './user-service.service.js';
import { UserServiceController } from './user-service.controller.js';

const details = { firstName: 'Test', lastName: 'Employee', email: 'person@example.com', phone: '123456789', password: 'initial-password-123' };
describe('user accounts and administration', () => {
  let db: DataSource;
  let service: UserServiceService;
  let controller: UserServiceController;
  beforeEach(async () => {
    db = await new DataSource({ type: 'sqlite', database: ':memory:', entities: [Employee, UserSession], synchronize: true }).initialize();
    service = new UserServiceService(db.getRepository(Employee), db.getRepository(UserSession));
    controller = new UserServiceController(service);
  });
  afterEach(async () => { if (db?.isInitialized) await db.destroy(); });
  it('creates accounts with hashed passwords and authenticates normalized email', async () => {
    const account = await service.createEmployee(details);
    expect(account).not.toHaveProperty('passwordHash');
    const stored = await db.getRepository(Employee).createQueryBuilder('employee').addSelect('employee.passwordHash').getOneOrFail();
    expect(stored.passwordHash).not.toContain(details.password);
    expect((await service.getEmployee())[0]).not.toHaveProperty('passwordHash');
    const login = await service.login('PERSON@EXAMPLE.COM', details.password);
    expect(login.user.id).toBe(account.id);
    expect((await service.me(`Bearer ${login.accessToken}`)).email).toBe(details.email);
    expect(await db.getRepository(UserSession).findOneByOrFail({ employeeId: account.id })).not.toHaveProperty('accessToken');
    await expect(service.login(details.email, 'wrong')).rejects.toThrow('Invalid email or password');
  });
  it('requires an authenticated admin on account list, creation and password reset endpoints', async () => {
    const account = await service.createEmployee(details);
    const login = await service.login(details.email, details.password);
    const auth = `Bearer ${login.accessToken}`;
    await expect(controller.getEmployee()).rejects.toThrow('Sign in');
    await expect(controller.getEmployee(auth)).rejects.toThrow('Administrator');
    await expect(controller.createEmployee(auth, { ...details, email: 'other@example.com', phone: 'other' })).rejects.toThrow('Administrator');
    await expect(controller.resetPassword(auth, account.id, { password: 'reset-password-123' })).rejects.toThrow('Administrator');
  });
  it('allows an admin to create and reset another account, revoking old sessions', async () => {
    const admin = await service.createEmployee({ ...details, email: 'admin@example.com', phone: 'admin', role: 'ADMIN' });
    const adminLogin = await service.login(admin.email, details.password);
    const auth = `Bearer ${adminLogin.accessToken}`;
    const employee = await controller.createEmployee(auth, details);
    const login = await service.login(details.email, details.password);
    await controller.resetPassword(auth, employee.id, { password: 'changed-password-123' });
    await expect(service.me(`Bearer ${login.accessToken}`)).rejects.toThrow('session');
    await expect(service.login(details.email, details.password)).rejects.toThrow('Invalid');
    expect((await service.login(details.email, 'changed-password-123')).success).toBe(true);
    await expect(controller.resetPassword(auth, admin.id, { password: 'changed-password-123' })).rejects.toThrow('own password');
  });
  it('requires the current password and revokes all sessions after a self change', async () => {
    await service.createEmployee(details);
    const first = await service.login(details.email, details.password);
    const second = await service.login(details.email, details.password);
    const auth = `Bearer ${first.accessToken}`;
    await expect(service.changePassword(auth, 'wrong', 'changed-password-123')).rejects.toThrow('incorrect');
    await service.changePassword(auth, details.password, 'changed-password-123');
    await expect(service.me(auth)).rejects.toThrow('session');
    await expect(service.me(`Bearer ${second.accessToken}`)).rejects.toThrow('session');
  });
  it('validates passwords and prevents duplicate email and phone numbers', async () => {
    await expect(service.createEmployee({ ...details, password: 'short' })).rejects.toThrow('12 to 128');
    await service.createEmployee(details);
    await expect(service.createEmployee({ ...details, email: 'PERSON@example.com', phone: 'other' })).rejects.toThrow('already exists');
    await expect(service.createEmployee({ ...details, email: 'other@example.com' })).rejects.toThrow('already exists');
  });
  it('rejects expired, logged-out and inactive sessions', async () => {
    const account = await service.createEmployee(details);
    const first = await service.login(details.email, details.password);
    await service.logout(`Bearer ${first.accessToken}`);
    await expect(service.me(`Bearer ${first.accessToken}`)).rejects.toThrow();
    const second = await service.login(details.email, details.password);
    await db.getRepository(UserSession).update({ employeeId: account.id }, { expiresAt: new Date(0) });
    await expect(service.me(`Bearer ${second.accessToken}`)).rejects.toThrow('expired');
    await db.getRepository(Employee).update({ employee_id: account.id }, { status: 'INACTIVE' });
    await expect(service.login(details.email, details.password)).rejects.toThrow('Invalid');
  });
  it('bootstraps the first admin without overwriting its password on later starts', async () => {
    const oldEmail = process.env.INITIAL_ADMIN_EMAIL;
    const oldPassword = process.env.INITIAL_ADMIN_PASSWORD;
    try {
      process.env.INITIAL_ADMIN_EMAIL = 'bootstrap@example.com';
      process.env.INITIAL_ADMIN_PASSWORD = 'bootstrap-password-123';
      await service.onModuleInit();
      expect((await service.login('bootstrap@example.com', 'bootstrap-password-123')).user.role).toBe('admin');
      process.env.INITIAL_ADMIN_PASSWORD = 'different-password-123';
      await service.onModuleInit();
      expect((await service.login('bootstrap@example.com', 'bootstrap-password-123')).success).toBe(true);
      expect(await db.getRepository(Employee).count()).toBe(1);
    } finally {
      if (oldEmail === undefined) delete process.env.INITIAL_ADMIN_EMAIL; else process.env.INITIAL_ADMIN_EMAIL = oldEmail;
      if (oldPassword === undefined) delete process.env.INITIAL_ADMIN_PASSWORD; else process.env.INITIAL_ADMIN_PASSWORD = oldPassword;
    }
  });

});
