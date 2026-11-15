import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContactServiceController } from './contact-service.controller.js';
import { ContactServiceService } from './contact-service.service.js';
import { Contact } from './entities/contact.entity.js';

describe('ContactServiceController', () => {
  let contactServiceController: ContactServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ContactServiceController],
      providers: [
        ContactServiceService,
        { provide: getRepositoryToken(Contact, 'contacts'), useValue: {} },
      ],
    }).compile();

    contactServiceController = app.get<ContactServiceController>(ContactServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(contactServiceController.getHello()).toBe('Hello World!');
    });
  });
});
