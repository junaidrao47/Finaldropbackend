import { NotFoundException } from '@nestjs/common';
import { ContactsSettingsService } from './contacts-settings.service';
import { ContactType } from './dto/settings-extended.dto';

// Mock contacts data
const mockContacts = [
  {
    id: 'contact-1',
    organizationId: 'org-1',
    name: 'John Doe',
    type: 'Sender',
    contactNumber: '+1234567890',
    email: 'john@example.com',
    alternatePhone: null,
    company: 'ACME Corp',
    notes: 'VIP customer',
    isActive: true,
    isDeleted: false,
    createdBy: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedBy: 'user-1',
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'contact-2',
    organizationId: 'org-1',
    name: 'Jane Smith',
    type: 'Carrier',
    contactNumber: '+0987654321',
    email: 'jane@carrier.com',
    alternatePhone: '+1111111111',
    company: 'Fast Shipping',
    notes: null,
    isActive: true,
    isDeleted: false,
    createdBy: 'user-1',
    createdAt: new Date('2024-01-02'),
    updatedBy: 'user-1',
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'contact-3',
    organizationId: 'org-1',
    name: 'Bob Wilson',
    type: 'Recipient',
    contactNumber: '+5555555555',
    email: 'bob@recipient.com',
    alternatePhone: null,
    company: null,
    notes: null,
    isActive: false,
    isDeleted: false,
    createdBy: 'user-1',
    createdAt: new Date('2024-01-03'),
    updatedBy: 'user-1',
    updatedAt: new Date('2024-01-03'),
  },
];

describe('ContactsSettingsService', () => {
  let service: ContactsSettingsService;
  let mockDb: any;

  beforeEach(() => {
    // Create chainable mock database
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    // Instantiate service with mock DB
    service = new ContactsSettingsService(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getContacts', () => {
    it('should return paginated contacts with default pagination', async () => {
      // Setup count query mock
      const countChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 3 }]),
      };

      // Setup data query mock  
      const dataChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockContacts),
      };

      mockDb.select
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(dataChain);

      const result = await service.getContacts('org-1', {});

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should handle empty results', async () => {
      const countChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 0 }]),
      };

      const dataChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };

      mockDb.select
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(dataChain);

      const result = await service.getContacts('org-1', {});

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should filter contacts by type', async () => {
      const senderContacts = mockContacts.filter(c => c.type === 'Sender');

      const countChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }]),
      };

      const dataChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(senderContacts),
      };

      mockDb.select
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(dataChain);

      const result = await service.getContacts('org-1', { type: ContactType.SENDER });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe(ContactType.SENDER);
    });

    it('should filter by isActive status', async () => {
      const activeContacts = mockContacts.filter(c => c.isActive);

      const countChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 2 }]),
      };

      const dataChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(activeContacts),
      };

      mockDb.select
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(dataChain);

      const result = await service.getContacts('org-1', { isActive: true });

      expect(result.data.every(c => c.isActive)).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const countChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 50 }]),
      };

      const dataChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([mockContacts[0]]),
      };

      mockDb.select
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(dataChain);

      const result = await service.getContacts('org-1', { page: 2, limit: 10 });

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5);
    });

    it('should search contacts by name/email/phone/company', async () => {
      const searchResults = [mockContacts[0]];

      const countChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }]),
      };

      const dataChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(searchResults),
      };

      mockDb.select
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(dataChain);

      const result = await service.getContacts('org-1', { search: 'john' });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getContact', () => {
    it('should return a single contact by ID', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockContacts[0]]),
        }),
      });

      const result = await service.getContact('contact-1', 'org-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('contact-1');
      expect(result.name).toBe('John Doe');
    });

    it('should throw NotFoundException for non-existent contact', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.getContact('non-existent', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should not return deleted contact', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.getContact('deleted-contact', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createContact', () => {
    it('should create a new contact successfully', async () => {
      const newContact = {
        name: 'New Contact',
        type: ContactType.SENDER,
        contactNumber: '+1111111111',
        email: 'new@example.com',
        company: 'New Corp',
      };

      const createdContact = {
        id: 'contact-new',
        organizationId: 'org-1',
        ...newContact,
        alternatePhone: null,
        notes: null,
        isActive: true,
        isDeleted: false,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedBy: 'user-1',
        updatedAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdContact]),
        }),
      });

      const result = await service.createContact('org-1', newContact, 'user-1');

      expect(result).toBeDefined();
      expect(result.name).toBe('New Contact');
      expect(result.type).toBe(ContactType.SENDER);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should set isActive to true by default', async () => {
      const newContact = {
        name: 'Default Active Contact',
        type: ContactType.CARRIER,
      };

      const createdContact = {
        id: 'contact-new',
        organizationId: 'org-1',
        name: newContact.name,
        type: newContact.type,
        contactNumber: null,
        email: null,
        alternatePhone: null,
        company: null,
        notes: null,
        isActive: true,
        isDeleted: false,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedBy: 'user-1',
        updatedAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdContact]),
        }),
      });

      const result = await service.createContact('org-1', newContact, 'user-1');

      expect(result.isActive).toBe(true);
    });

    it('should handle optional fields correctly', async () => {
      const minimalContact = {
        name: 'Minimal Contact',
        type: ContactType.RECIPIENT,
      };

      const createdContact = {
        id: 'contact-min',
        organizationId: 'org-1',
        ...minimalContact,
        contactNumber: null,
        email: null,
        alternatePhone: null,
        company: null,
        notes: null,
        isActive: true,
        isDeleted: false,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedBy: 'user-1',
        updatedAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdContact]),
        }),
      });

      const result = await service.createContact('org-1', minimalContact, 'user-1');

      expect(result.contactNumber).toBeUndefined();
      expect(result.email).toBeUndefined();
    });
  });

  describe('updateContact', () => {
    it('should update an existing contact', async () => {
      // Mock getContact
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockContacts[0]]),
        }),
      });

      const updatedContact = {
        ...mockContacts[0],
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedContact]),
          }),
        }),
      });

      const result = await service.updateContact(
        'contact-1',
        'org-1',
        { name: 'Updated Name', email: 'updated@example.com' },
        'user-1'
      );

      expect(result.name).toBe('Updated Name');
      expect(result.email).toBe('updated@example.com');
    });

    it('should throw NotFoundException when updating non-existent contact', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.updateContact('non-existent', 'org-1', { name: 'Test' }, 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should only update provided fields', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockContacts[0]]),
        }),
      });

      const updatedContact = {
        ...mockContacts[0],
        name: 'Only Name Updated',
      };

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedContact]),
          }),
        }),
      });

      const result = await service.updateContact(
        'contact-1',
        'org-1',
        { name: 'Only Name Updated' },
        'user-1'
      );

      expect(result.name).toBe('Only Name Updated');
      expect(result.email).toBe('john@example.com'); // Original email preserved
    });
  });

  describe('deleteContact', () => {
    it('should soft delete a contact', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockContacts[0]]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await expect(service.deleteContact('contact-1', 'org-1', 'user-1')).resolves.not.toThrow();
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when deleting non-existent contact', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.deleteContact('non-existent', 'org-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleContactStatus', () => {
    it('should toggle contact from active to inactive', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockContacts[0]]), // isActive: true
        }),
      });

      const toggledContact = { ...mockContacts[0], isActive: false };

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([toggledContact]),
          }),
        }),
      });

      const result = await service.toggleContactStatus('contact-1', 'org-1', 'user-1');

      expect(result.isActive).toBe(false);
    });

    it('should toggle contact from inactive to active', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockContacts[2]]), // isActive: false
        }),
      });

      const toggledContact = { ...mockContacts[2], isActive: true };

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([toggledContact]),
          }),
        }),
      });

      const result = await service.toggleContactStatus('contact-3', 'org-1', 'user-1');

      expect(result.isActive).toBe(true);
    });
  });

  describe('bulkImport', () => {
    it('should import multiple contacts successfully', async () => {
      const contactsToImport = [
        { name: 'Import 1', type: ContactType.SENDER },
        { name: 'Import 2', type: ContactType.CARRIER },
      ];

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn()
            .mockResolvedValueOnce([{ 
              id: 'new-1', 
              name: 'Import 1', 
              type: 'Sender', 
              isActive: true, 
              createdAt: new Date(), 
              updatedAt: new Date() 
            }])
            .mockResolvedValueOnce([{ 
              id: 'new-2', 
              name: 'Import 2', 
              type: 'Carrier', 
              isActive: true, 
              createdAt: new Date(), 
              updatedAt: new Date() 
            }]),
        }),
      });

      const result = await service.bulkImport('org-1', contactsToImport, 'user-1');

      expect(result.imported).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial import failures', async () => {
      const contactsToImport = [
        { name: 'Import Success', type: ContactType.SENDER },
        { name: 'Import Fail', type: ContactType.CARRIER },
      ];

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn()
            .mockResolvedValueOnce([{ 
              id: 'new-1', 
              name: 'Import Success', 
              type: 'Sender', 
              isActive: true, 
              createdAt: new Date(), 
              updatedAt: new Date() 
            }])
            .mockRejectedValueOnce(new Error('Database error')),
        }),
      });

      const result = await service.bulkImport('org-1', contactsToImport, 'user-1');

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Import Fail');
    });

    it('should handle all failures gracefully', async () => {
      const contactsToImport = [
        { name: 'Fail 1', type: ContactType.SENDER },
        { name: 'Fail 2', type: ContactType.CARRIER },
      ];

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn()
            .mockRejectedValueOnce(new Error('Error 1'))
            .mockRejectedValueOnce(new Error('Error 2')),
        }),
      });

      const result = await service.bulkImport('org-1', contactsToImport, 'user-1');

      expect(result.imported).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('exportContacts', () => {
    it('should export all contacts for organization', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockContacts),
          }),
        }),
      });

      const result = await service.exportContacts('org-1');

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('type');
    });

    it('should export contacts filtered by type', async () => {
      const senderContacts = mockContacts.filter(c => c.type === 'Sender');

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(senderContacts),
          }),
        }),
      });

      const result = await service.exportContacts('org-1', ContactType.SENDER);

      expect(result.every(c => c.type === ContactType.SENDER)).toBe(true);
    });

    it('should return empty array when no contacts exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.exportContacts('org-1');

      expect(result).toHaveLength(0);
    });
  });
});
