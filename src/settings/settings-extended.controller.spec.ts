import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SettingsExtendedController } from './settings-extended.controller';
import { ContactsSettingsService } from './contacts-settings.service';
import { BlacklistSettingsService } from './blacklist-settings.service';
import { WarningMessagesService } from './warning-messages.service';
import { LinkedDevicesService } from './linked-devices.service';
import { SupportService } from './support.service';
import { ReportsService } from './reports.service';
import {
  ContactType,
  BlacklistType,
  WarningSeverity,
  TicketCategory,
  TicketStatus,
  TicketPriority,
  ReportType,
} from './dto/settings-extended.dto';

// Mock services
const mockContactsService = {
  getContacts: jest.fn(),
  getContact: jest.fn(),
  createContact: jest.fn(),
  updateContact: jest.fn(),
  deleteContact: jest.fn(),
  toggleContactStatus: jest.fn(),
  exportContacts: jest.fn(),
  bulkImport: jest.fn(),
};

const mockBlacklistService = {
  getBlacklist: jest.fn(),
  getBlacklistEntry: jest.fn(),
  addToBlacklist: jest.fn(),
  updateBlacklistEntry: jest.fn(),
  archiveBlacklistEntry: jest.fn(),
  restoreBlacklistEntry: jest.fn(),
  removeFromBlacklist: jest.fn(),
  isBlacklisted: jest.fn(),
  getBlacklistStats: jest.fn(),
};

const mockWarningMessagesService = {
  getWarningMessages: jest.fn(),
  getWarningMessage: jest.fn(),
  getActiveWarningsForType: jest.fn(),
  createWarningMessage: jest.fn(),
  updateWarningMessage: jest.fn(),
  archiveWarningMessage: jest.fn(),
  restoreWarningMessage: jest.fn(),
  deleteWarningMessage: jest.fn(),
  reorderWarningMessages: jest.fn(),
  getWarningMessageStats: jest.fn(),
};

const mockLinkedDevicesService = {
  getLinkedDevices: jest.fn(),
  getDevice: jest.fn(),
  updateDevice: jest.fn(),
  toggleDeviceTrust: jest.fn(),
  revokeDevice: jest.fn(),
  revokeAllDevicesExcept: jest.fn(),
  getDeviceStats: jest.fn(),
};

const mockSupportService = {
  getTickets: jest.fn(),
  getTicket: jest.fn(),
  createTicket: jest.fn(),
  updateTicket: jest.fn(),
  addMessage: jest.fn(),
  closeTicket: jest.fn(),
  getTicketStats: jest.fn(),
  getFaqCategories: jest.fn(),
  getFaqs: jest.fn(),
  getSupportContactInfo: jest.fn(),
  submitRating: jest.fn(),
  getRatingStats: jest.fn(),
  getUserRating: jest.fn(),
};

const mockReportsService = {
  getReports: jest.fn(),
  getReport: jest.fn(),
  createReport: jest.fn(),
  updateReport: jest.fn(),
  deleteReport: jest.fn(),
  generateReportData: jest.fn(),
  getReportTypes: jest.fn(),
  getQuickStats: jest.fn(),
};

describe('SettingsExtendedController', () => {
  let controller: SettingsExtendedController;

  const mockRequest = {
    user: {
      id: 'user-1',
      organizationId: 'org-1',
      isAdmin: false,
    },
  };

  const mockAdminRequest = {
    user: {
      id: 'admin-1',
      organizationId: 'org-1',
      isAdmin: true,
    },
  };

  beforeEach(() => {
    // Instantiate controller with mock services
    controller = new SettingsExtendedController(
      mockContactsService as unknown as ContactsSettingsService,
      mockBlacklistService as unknown as BlacklistSettingsService,
      mockWarningMessagesService as unknown as WarningMessagesService,
      mockLinkedDevicesService as unknown as LinkedDevicesService,
      mockSupportService as unknown as SupportService,
      mockReportsService as unknown as ReportsService,
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ==================== Contacts Endpoints ====================
  describe('Contacts Management', () => {
    describe('GET /settings/contacts', () => {
      it('should return paginated contacts', async () => {
        const mockResult = {
          data: [{ id: 'contact-1', name: 'Test Contact' }],
          total: 1,
          page: 1,
          limit: 10,
        };
        mockContactsService.getContacts.mockResolvedValue(mockResult);

        const result = await controller.getContacts(mockRequest, { page: 1, limit: 10 });

        expect(mockContactsService.getContacts).toHaveBeenCalledWith('org-1', { page: 1, limit: 10 });
        expect(result).toEqual(mockResult);
      });

      it('should pass filter parameters', async () => {
        const filters = { type: ContactType.CARRIER, isActive: true, search: 'test' };
        mockContactsService.getContacts.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

        await controller.getContacts(mockRequest, filters);

        expect(mockContactsService.getContacts).toHaveBeenCalledWith('org-1', filters);
      });
    });

    describe('GET /settings/contacts/:id', () => {
      it('should return a single contact', async () => {
        const mockContact = { id: 'contact-1', name: 'Test Contact' };
        mockContactsService.getContact.mockResolvedValue(mockContact);

        const result = await controller.getContact(mockRequest, 'contact-1');

        expect(mockContactsService.getContact).toHaveBeenCalledWith('contact-1', 'org-1');
        expect(result).toEqual(mockContact);
      });

      it('should throw NotFoundException for non-existent contact', async () => {
        mockContactsService.getContact.mockRejectedValue(new NotFoundException('Contact not found'));

        await expect(controller.getContact(mockRequest, 'non-existent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('POST /settings/contacts', () => {
      it('should create a new contact', async () => {
        const createDto = {
          name: 'New Contact',
          type: ContactType.CARRIER,
          email: 'contact@example.com',
        };
        const mockCreated = { id: 'contact-new', ...createDto };
        mockContactsService.createContact.mockResolvedValue(mockCreated);

        const result = await controller.createContact(mockRequest, createDto);

        expect(mockContactsService.createContact).toHaveBeenCalledWith('org-1', createDto, 'user-1');
        expect(result).toEqual(mockCreated);
      });
    });

    describe('PUT /settings/contacts/:id', () => {
      it('should update a contact', async () => {
        const updateDto = { name: 'Updated Name' };
        const mockUpdated = { id: 'contact-1', name: 'Updated Name' };
        mockContactsService.updateContact.mockResolvedValue(mockUpdated);

        const result = await controller.updateContact(mockRequest, 'contact-1', updateDto);

        expect(mockContactsService.updateContact).toHaveBeenCalledWith('contact-1', 'org-1', updateDto, 'user-1');
        expect(result).toEqual(mockUpdated);
      });
    });

    describe('DELETE /settings/contacts/:id', () => {
      it('should delete a contact', async () => {
        mockContactsService.deleteContact.mockResolvedValue(undefined);

        await controller.deleteContact(mockRequest, 'contact-1');

        expect(mockContactsService.deleteContact).toHaveBeenCalledWith('contact-1', 'org-1', 'user-1');
      });
    });

    describe('POST /settings/contacts/:id/toggle', () => {
      it('should toggle contact status', async () => {
        const mockToggled = { id: 'contact-1', isActive: false };
        mockContactsService.toggleContactStatus.mockResolvedValue(mockToggled);

        const result = await controller.toggleContactStatus(mockRequest, 'contact-1');

        expect(mockContactsService.toggleContactStatus).toHaveBeenCalledWith('contact-1', 'org-1', 'user-1');
        expect(result).toEqual(mockToggled);
      });
    });

    describe('GET /settings/contacts/export/all', () => {
      it('should export all contacts', async () => {
        const mockExport = [{ id: 'contact-1', name: 'Contact 1' }];
        mockContactsService.exportContacts.mockResolvedValue(mockExport);

        const result = await controller.exportContacts(mockRequest);

        expect(mockContactsService.exportContacts).toHaveBeenCalledWith('org-1', undefined);
        expect(result).toEqual(mockExport);
      });

      it('should export contacts filtered by type', async () => {
        mockContactsService.exportContacts.mockResolvedValue([]);

        await controller.exportContacts(mockRequest, ContactType.SENDER);

        expect(mockContactsService.exportContacts).toHaveBeenCalledWith('org-1', ContactType.SENDER);
      });
    });

    describe('POST /settings/contacts/import', () => {
      it('should bulk import contacts', async () => {
        const contacts = [
          { name: 'Contact 1', type: ContactType.CARRIER, email: 'c1@test.com' },
          { name: 'Contact 2', type: ContactType.SENDER, phone: '1234567890' },
        ];
        const mockResult = { success: 2, failed: 0, errors: [] };
        mockContactsService.bulkImport.mockResolvedValue(mockResult);

        const result = await controller.importContacts(mockRequest, contacts);

        expect(mockContactsService.bulkImport).toHaveBeenCalledWith('org-1', contacts, 'user-1');
        expect(result).toEqual(mockResult);
      });
    });
  });

  // ==================== Blacklist Endpoints ====================
  describe('Blacklist Management', () => {
    describe('GET /settings/blacklist', () => {
      it('should return paginated blacklist entries', async () => {
        const mockResult = {
          data: [{ id: 'blacklist-1', name: 'Blocked Entity' }],
          total: 1,
          page: 1,
          limit: 10,
        };
        mockBlacklistService.getBlacklist.mockResolvedValue(mockResult);

        const result = await controller.getBlacklist(mockRequest, { page: 1, limit: 10 });

        expect(mockBlacklistService.getBlacklist).toHaveBeenCalledWith('org-1', { page: 1, limit: 10 });
        expect(result).toEqual(mockResult);
      });
    });

    describe('GET /settings/blacklist/stats', () => {
      it('should return blacklist statistics', async () => {
        const mockStats = { totalActive: 10, totalArchived: 5, byType: {} };
        mockBlacklistService.getBlacklistStats.mockResolvedValue(mockStats);

        const result = await controller.getBlacklistStats(mockRequest);

        expect(mockBlacklistService.getBlacklistStats).toHaveBeenCalledWith('org-1');
        expect(result).toEqual(mockStats);
      });
    });

    describe('GET /settings/blacklist/:id', () => {
      it('should return a single blacklist entry', async () => {
        const mockEntry = { id: 'blacklist-1', name: 'Blocked Entity' };
        mockBlacklistService.getBlacklistEntry.mockResolvedValue(mockEntry);

        const result = await controller.getBlacklistEntry(mockRequest, 'blacklist-1');

        expect(mockBlacklistService.getBlacklistEntry).toHaveBeenCalledWith('blacklist-1', 'org-1');
        expect(result).toEqual(mockEntry);
      });
    });

    describe('POST /settings/blacklist', () => {
      it('should add to blacklist', async () => {
        const addDto = {
          type: BlacklistType.CARRIER,
          name: 'Blocked Carrier',
          reason: 'Testing',
        };
        const mockCreated = { id: 'blacklist-new', ...addDto };
        mockBlacklistService.addToBlacklist.mockResolvedValue(mockCreated);

        const result = await controller.addToBlacklist(mockRequest, addDto);

        expect(mockBlacklistService.addToBlacklist).toHaveBeenCalledWith('org-1', addDto, 'user-1');
        expect(result).toEqual(mockCreated);
      });
    });

    describe('PUT /settings/blacklist/:id', () => {
      it('should update blacklist entry', async () => {
        const updateDto = { reason: 'Updated reason' };
        const mockUpdated = { id: 'blacklist-1', reason: 'Updated reason' };
        mockBlacklistService.updateBlacklistEntry.mockResolvedValue(mockUpdated);

        const result = await controller.updateBlacklistEntry(mockRequest, 'blacklist-1', updateDto);

        expect(mockBlacklistService.updateBlacklistEntry).toHaveBeenCalledWith('blacklist-1', 'org-1', updateDto, 'user-1');
        expect(result).toEqual(mockUpdated);
      });
    });

    describe('POST /settings/blacklist/:id/archive', () => {
      it('should archive blacklist entry', async () => {
        const mockArchived = { id: 'blacklist-1', archivedAt: new Date() };
        mockBlacklistService.archiveBlacklistEntry.mockResolvedValue(mockArchived);

        const result = await controller.archiveBlacklistEntry(mockRequest, 'blacklist-1');

        expect(mockBlacklistService.archiveBlacklistEntry).toHaveBeenCalledWith('blacklist-1', 'org-1', 'user-1');
        expect(result).toEqual(mockArchived);
      });
    });

    describe('POST /settings/blacklist/:id/restore', () => {
      it('should restore blacklist entry', async () => {
        const mockRestored = { id: 'blacklist-1', archivedAt: null };
        mockBlacklistService.restoreBlacklistEntry.mockResolvedValue(mockRestored);

        const result = await controller.restoreBlacklistEntry(mockRequest, 'blacklist-1');

        expect(mockBlacklistService.restoreBlacklistEntry).toHaveBeenCalledWith('blacklist-1', 'org-1', 'user-1');
        expect(result).toEqual(mockRestored);
      });
    });

    describe('DELETE /settings/blacklist/:id', () => {
      it('should remove from blacklist', async () => {
        mockBlacklistService.removeFromBlacklist.mockResolvedValue(undefined);

        await controller.removeFromBlacklist(mockRequest, 'blacklist-1');

        expect(mockBlacklistService.removeFromBlacklist).toHaveBeenCalledWith('blacklist-1', 'org-1', 'user-1');
      });
    });

    describe('POST /settings/blacklist/check', () => {
      it('should check if entity is blacklisted', async () => {
        mockBlacklistService.isBlacklisted.mockResolvedValue(true);

        const result = await controller.checkBlacklisted(mockRequest, {
          type: BlacklistType.CARRIER,
          email: 'blocked@example.com',
        });

        expect(mockBlacklistService.isBlacklisted).toHaveBeenCalledWith('org-1', BlacklistType.CARRIER, {
          email: 'blocked@example.com',
          phone: undefined,
          entityId: undefined,
        });
        expect(result).toEqual({ isBlacklisted: true });
      });

      it('should return false if not blacklisted', async () => {
        mockBlacklistService.isBlacklisted.mockResolvedValue(false);

        const result = await controller.checkBlacklisted(mockRequest, {
          type: BlacklistType.SENDER,
          phone: '1234567890',
        });

        expect(result).toEqual({ isBlacklisted: false });
      });
    });
  });

  // ==================== Warning Messages Endpoints ====================
  describe('Warning Messages Management', () => {
    describe('GET /settings/warning-messages', () => {
      it('should return paginated warning messages', async () => {
        const mockResult = {
          data: [{ id: 'warning-1', message: 'Test warning' }],
          total: 1,
          page: 1,
          limit: 10,
        };
        mockWarningMessagesService.getWarningMessages.mockResolvedValue(mockResult);

        const result = await controller.getWarningMessages(mockRequest, { page: 1, limit: 10 });

        expect(mockWarningMessagesService.getWarningMessages).toHaveBeenCalledWith('org-1', { page: 1, limit: 10 });
        expect(result).toEqual(mockResult);
      });
    });

    describe('GET /settings/warning-messages/stats', () => {
      it('should return warning message statistics', async () => {
        const mockStats = { totalActive: 5, totalArchived: 2, bySeverity: {} };
        mockWarningMessagesService.getWarningMessageStats.mockResolvedValue(mockStats);

        const result = await controller.getWarningMessageStats(mockRequest);

        expect(mockWarningMessagesService.getWarningMessageStats).toHaveBeenCalledWith('org-1');
        expect(result).toEqual(mockStats);
      });
    });

    describe('GET /settings/warning-messages/active/:type', () => {
      it('should return active warnings for type', async () => {
        const mockWarnings = [{ id: 'warning-1', message: 'Active warning' }];
        mockWarningMessagesService.getActiveWarningsForType.mockResolvedValue(mockWarnings);

        const result = await controller.getActiveWarnings(mockRequest, ContactType.CARRIER);

        expect(mockWarningMessagesService.getActiveWarningsForType).toHaveBeenCalledWith('org-1', ContactType.CARRIER);
        expect(result).toEqual(mockWarnings);
      });
    });

    describe('GET /settings/warning-messages/:id', () => {
      it('should return a single warning message', async () => {
        const mockWarning = { id: 'warning-1', message: 'Test warning' };
        mockWarningMessagesService.getWarningMessage.mockResolvedValue(mockWarning);

        const result = await controller.getWarningMessage(mockRequest, 'warning-1');

        expect(mockWarningMessagesService.getWarningMessage).toHaveBeenCalledWith('warning-1', 'org-1');
        expect(result).toEqual(mockWarning);
      });
    });

    describe('POST /settings/warning-messages', () => {
      it('should create a warning message', async () => {
        const createDto = {
          type: ContactType.CARRIER,
          title: 'Warning Title',
          message: 'New warning',
          severity: WarningSeverity.WARNING,
        };
        const mockCreated = { id: 'warning-new', ...createDto };
        mockWarningMessagesService.createWarningMessage.mockResolvedValue(mockCreated);

        const result = await controller.createWarningMessage(mockRequest, createDto);

        expect(mockWarningMessagesService.createWarningMessage).toHaveBeenCalledWith('org-1', createDto, 'user-1');
        expect(result).toEqual(mockCreated);
      });
    });

    describe('PUT /settings/warning-messages/:id', () => {
      it('should update a warning message', async () => {
        const updateDto = { message: 'Updated warning' };
        const mockUpdated = { id: 'warning-1', message: 'Updated warning' };
        mockWarningMessagesService.updateWarningMessage.mockResolvedValue(mockUpdated);

        const result = await controller.updateWarningMessage(mockRequest, 'warning-1', updateDto);

        expect(mockWarningMessagesService.updateWarningMessage).toHaveBeenCalledWith('warning-1', 'org-1', updateDto, 'user-1');
        expect(result).toEqual(mockUpdated);
      });
    });

    describe('POST /settings/warning-messages/:id/archive', () => {
      it('should archive a warning message', async () => {
        const mockArchived = { id: 'warning-1', archivedAt: new Date() };
        mockWarningMessagesService.archiveWarningMessage.mockResolvedValue(mockArchived);

        const result = await controller.archiveWarningMessage(mockRequest, 'warning-1');

        expect(mockWarningMessagesService.archiveWarningMessage).toHaveBeenCalledWith('warning-1', 'org-1', 'user-1');
        expect(result).toEqual(mockArchived);
      });
    });

    describe('POST /settings/warning-messages/:id/restore', () => {
      it('should restore a warning message', async () => {
        const mockRestored = { id: 'warning-1', archivedAt: null };
        mockWarningMessagesService.restoreWarningMessage.mockResolvedValue(mockRestored);

        const result = await controller.restoreWarningMessage(mockRequest, 'warning-1');

        expect(mockWarningMessagesService.restoreWarningMessage).toHaveBeenCalledWith('warning-1', 'org-1', 'user-1');
        expect(result).toEqual(mockRestored);
      });
    });

    describe('DELETE /settings/warning-messages/:id', () => {
      it('should delete a warning message', async () => {
        mockWarningMessagesService.deleteWarningMessage.mockResolvedValue(undefined);

        await controller.deleteWarningMessage(mockRequest, 'warning-1');

        expect(mockWarningMessagesService.deleteWarningMessage).toHaveBeenCalledWith('warning-1', 'org-1', 'user-1');
      });
    });

    describe('POST /settings/warning-messages/reorder', () => {
      it('should reorder warning messages', async () => {
        const orderedIds = ['warning-3', 'warning-1', 'warning-2'];
        mockWarningMessagesService.reorderWarningMessages.mockResolvedValue(undefined);

        const result = await controller.reorderWarningMessages(mockRequest, { orderedIds });

        expect(mockWarningMessagesService.reorderWarningMessages).toHaveBeenCalledWith('org-1', orderedIds, 'user-1');
        expect(result).toEqual({ success: true });
      });
    });
  });

  // ==================== Linked Devices Endpoints ====================
  describe('Linked Devices Management', () => {
    describe('GET /settings/devices', () => {
      it('should return paginated linked devices', async () => {
        const mockResult = {
          data: [{ id: 'device-1', deviceName: 'Test Device' }],
          total: 1,
          page: 1,
          limit: 10,
        };
        mockLinkedDevicesService.getLinkedDevices.mockResolvedValue(mockResult);

        const result = await controller.getLinkedDevices(mockRequest, { page: 1, limit: 10 });

        expect(mockLinkedDevicesService.getLinkedDevices).toHaveBeenCalledWith('user-1', { page: 1, limit: 10 });
        expect(result).toEqual(mockResult);
      });
    });

    describe('GET /settings/devices/stats', () => {
      it('should return device statistics', async () => {
        const mockStats = { totalDevices: 3, trustedDevices: 2, activeDevices: 3 };
        mockLinkedDevicesService.getDeviceStats.mockResolvedValue(mockStats);

        const result = await controller.getDeviceStats(mockRequest);

        expect(mockLinkedDevicesService.getDeviceStats).toHaveBeenCalledWith('user-1');
        expect(result).toEqual(mockStats);
      });
    });

    describe('GET /settings/devices/:id', () => {
      it('should return a single device', async () => {
        const mockDevice = { id: 'device-1', deviceName: 'Test Device' };
        mockLinkedDevicesService.getDevice.mockResolvedValue(mockDevice);

        const result = await controller.getDevice(mockRequest, 'device-1');

        expect(mockLinkedDevicesService.getDevice).toHaveBeenCalledWith('device-1', 'user-1');
        expect(result).toEqual(mockDevice);
      });
    });

    describe('PUT /settings/devices/:id', () => {
      it('should update a device', async () => {
        const updateDto = { deviceName: 'Updated Device Name' };
        const mockUpdated = { id: 'device-1', deviceName: 'Updated Device Name' };
        mockLinkedDevicesService.updateDevice.mockResolvedValue(mockUpdated);

        const result = await controller.updateDevice(mockRequest, 'device-1', updateDto);

        expect(mockLinkedDevicesService.updateDevice).toHaveBeenCalledWith('device-1', 'user-1', updateDto);
        expect(result).toEqual(mockUpdated);
      });
    });

    describe('POST /settings/devices/:id/trust', () => {
      it('should toggle device trust', async () => {
        const mockToggled = { id: 'device-1', isTrusted: true };
        mockLinkedDevicesService.toggleDeviceTrust.mockResolvedValue(mockToggled);

        const result = await controller.toggleDeviceTrust(mockRequest, 'device-1');

        expect(mockLinkedDevicesService.toggleDeviceTrust).toHaveBeenCalledWith('device-1', 'user-1');
        expect(result).toEqual(mockToggled);
      });
    });

    describe('DELETE /settings/devices/:id', () => {
      it('should revoke a device', async () => {
        mockLinkedDevicesService.revokeDevice.mockResolvedValue(undefined);

        await controller.revokeDevice(mockRequest, 'device-1');

        expect(mockLinkedDevicesService.revokeDevice).toHaveBeenCalledWith('device-1', 'user-1');
      });
    });

    describe('POST /settings/devices/revoke-all', () => {
      it('should revoke all devices except current', async () => {
        const mockResult = { revokedCount: 3 };
        mockLinkedDevicesService.revokeAllDevicesExcept.mockResolvedValue(mockResult);

        const result = await controller.revokeAllDevices(mockRequest, { currentDeviceFingerprint: 'current-fingerprint' });

        expect(mockLinkedDevicesService.revokeAllDevicesExcept).toHaveBeenCalledWith('user-1', 'current-fingerprint');
        expect(result).toEqual(mockResult);
      });

      it('should handle missing fingerprint', async () => {
        const mockResult = { revokedCount: 4 };
        mockLinkedDevicesService.revokeAllDevicesExcept.mockResolvedValue(mockResult);

        const result = await controller.revokeAllDevices(mockRequest, {});

        expect(mockLinkedDevicesService.revokeAllDevicesExcept).toHaveBeenCalledWith('user-1', '');
        expect(result).toEqual(mockResult);
      });
    });
  });

  // ==================== Support Tickets Endpoints ====================
  describe('Support Tickets Management', () => {
    describe('GET /settings/support/tickets', () => {
      it('should return paginated tickets for user', async () => {
        const mockResult = {
          data: [{ id: 'ticket-1', subject: 'Test Ticket' }],
          total: 1,
          page: 1,
          limit: 10,
        };
        mockSupportService.getTickets.mockResolvedValue(mockResult);

        const result = await controller.getTickets(mockRequest, { page: 1, limit: 10 });

        expect(mockSupportService.getTickets).toHaveBeenCalledWith('user-1', { page: 1, limit: 10 }, false, 'org-1');
        expect(result).toEqual(mockResult);
      });

      it('should allow admin to see all tickets', async () => {
        mockSupportService.getTickets.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

        await controller.getTickets(mockAdminRequest, {});

        expect(mockSupportService.getTickets).toHaveBeenCalledWith('admin-1', {}, true, 'org-1');
      });
    });

    describe('GET /settings/support/tickets/stats', () => {
      it('should return ticket statistics', async () => {
        const mockStats = { open: 5, pending: 3, resolved: 10, closed: 2 };
        mockSupportService.getTicketStats.mockResolvedValue(mockStats);

        const result = await controller.getTicketStats(mockRequest);

        expect(mockSupportService.getTicketStats).toHaveBeenCalledWith('org-1');
        expect(result).toEqual(mockStats);
      });
    });

    describe('GET /settings/support/tickets/:id', () => {
      it('should return a single ticket', async () => {
        const mockTicket = { id: 'ticket-1', subject: 'Test Ticket', messages: [] };
        mockSupportService.getTicket.mockResolvedValue(mockTicket);

        const result = await controller.getTicket(mockRequest, 'ticket-1');

        expect(mockSupportService.getTicket).toHaveBeenCalledWith('ticket-1', 'user-1', false);
        expect(result).toEqual(mockTicket);
      });

      it('should allow admin to access any ticket', async () => {
        const mockTicket = { id: 'ticket-1', subject: 'Test Ticket' };
        mockSupportService.getTicket.mockResolvedValue(mockTicket);

        await controller.getTicket(mockAdminRequest, 'ticket-1');

        expect(mockSupportService.getTicket).toHaveBeenCalledWith('ticket-1', 'admin-1', true);
      });
    });

    describe('POST /settings/support/tickets', () => {
      it('should create a support ticket', async () => {
        const createDto = {
          subject: 'New Ticket',
          description: 'Ticket description',
          category: TicketCategory.TECHNICAL,
        };
        const mockCreated = { id: 'ticket-new', ...createDto };
        mockSupportService.createTicket.mockResolvedValue(mockCreated);

        const result = await controller.createTicket(mockRequest, createDto);

        expect(mockSupportService.createTicket).toHaveBeenCalledWith('user-1', createDto, 'org-1');
        expect(result).toEqual(mockCreated);
      });
    });

    describe('PUT /settings/support/tickets/:id', () => {
      it('should update a ticket', async () => {
        const updateDto = { status: TicketStatus.IN_PROGRESS };
        const mockUpdated = { id: 'ticket-1', status: TicketStatus.IN_PROGRESS };
        mockSupportService.updateTicket.mockResolvedValue(mockUpdated);

        const result = await controller.updateTicket(mockRequest, 'ticket-1', updateDto);

        expect(mockSupportService.updateTicket).toHaveBeenCalledWith('ticket-1', updateDto, 'user-1');
        expect(result).toEqual(mockUpdated);
      });
    });

    describe('POST /settings/support/tickets/:id/messages', () => {
      it('should add a message to ticket', async () => {
        const messageDto = { message: 'New message' };
        const mockMessage = { id: 'message-1', message: 'New message' };
        mockSupportService.addMessage.mockResolvedValue(mockMessage);

        const result = await controller.addTicketMessage(mockRequest, 'ticket-1', messageDto);

        expect(mockSupportService.addMessage).toHaveBeenCalledWith('ticket-1', messageDto, 'user-1', false);
        expect(result).toEqual(mockMessage);
      });

      it('should allow admin to add internal messages', async () => {
        const messageDto = { message: 'Internal note', isInternal: true };
        mockSupportService.addMessage.mockResolvedValue({ ...messageDto, id: 'message-1' });

        await controller.addTicketMessage(mockAdminRequest, 'ticket-1', messageDto);

        expect(mockSupportService.addMessage).toHaveBeenCalledWith('ticket-1', messageDto, 'admin-1', true);
      });
    });

    describe('POST /settings/support/tickets/:id/close', () => {
      it('should close a ticket', async () => {
        const mockClosed = { id: 'ticket-1', status: TicketStatus.CLOSED };
        mockSupportService.closeTicket.mockResolvedValue(mockClosed);

        const result = await controller.closeTicket(mockRequest, 'ticket-1');

        expect(mockSupportService.closeTicket).toHaveBeenCalledWith('ticket-1', 'user-1');
        expect(result).toEqual(mockClosed);
      });
    });
  });

  // ==================== Help & Support Content Endpoints ====================
  describe('Help & Support Content', () => {
    describe('GET /settings/support/faq/categories', () => {
      it('should return FAQ categories', () => {
        const mockCategories = [{ id: 'cat-1', name: 'General' }];
        mockSupportService.getFaqCategories.mockReturnValue(mockCategories);

        const result = controller.getFaqCategories();

        expect(mockSupportService.getFaqCategories).toHaveBeenCalled();
        expect(result).toEqual(mockCategories);
      });
    });

    describe('GET /settings/support/faq', () => {
      it('should return all FAQs', () => {
        const mockFaqs = [{ id: 'faq-1', question: 'How?', answer: 'Like this' }];
        mockSupportService.getFaqs.mockReturnValue(mockFaqs);

        const result = controller.getFaqs();

        expect(mockSupportService.getFaqs).toHaveBeenCalledWith(undefined);
        expect(result).toEqual(mockFaqs);
      });

      it('should filter FAQs by category', () => {
        mockSupportService.getFaqs.mockReturnValue([]);

        controller.getFaqs('general');

        expect(mockSupportService.getFaqs).toHaveBeenCalledWith('general');
      });
    });

    describe('GET /settings/support/contact', () => {
      it('should return support contact info', () => {
        const mockInfo = { email: 'support@example.com', phone: '123-456-7890' };
        mockSupportService.getSupportContactInfo.mockReturnValue(mockInfo);

        const result = controller.getSupportContactInfo();

        expect(mockSupportService.getSupportContactInfo).toHaveBeenCalled();
        expect(result).toEqual(mockInfo);
      });
    });
  });

  // ==================== App Rating Endpoints ====================
  describe('App Rating', () => {
    describe('POST /settings/rate', () => {
      it('should submit a rating', async () => {
        const ratingDto = { rating: 5, feedback: 'Great app!' };
        const mockRating = { id: 'rating-1', rating: 5 };
        mockSupportService.submitRating.mockResolvedValue(mockRating);

        const result = await controller.submitRating(mockRequest, ratingDto);

        expect(mockSupportService.submitRating).toHaveBeenCalledWith('user-1', ratingDto, 'org-1');
        expect(result).toEqual(mockRating);
      });

      it('should throw BadRequestException for duplicate rating', async () => {
        mockSupportService.submitRating.mockRejectedValue(new BadRequestException('Already rated'));

        await expect(controller.submitRating(mockRequest, { rating: 5 })).rejects.toThrow(BadRequestException);
      });
    });

    describe('GET /settings/rate/stats', () => {
      it('should return rating statistics', async () => {
        const mockStats = { averageRating: 4.5, totalRatings: 100 };
        mockSupportService.getRatingStats.mockResolvedValue(mockStats);

        const result = await controller.getRatingStats();

        expect(mockSupportService.getRatingStats).toHaveBeenCalled();
        expect(result).toEqual(mockStats);
      });
    });

    describe('GET /settings/rate/me', () => {
      it('should return user rating', async () => {
        const mockRating = { rating: 4, feedback: 'Good' };
        mockSupportService.getUserRating.mockResolvedValue(mockRating);

        const result = await controller.getUserRating(mockRequest);

        expect(mockSupportService.getUserRating).toHaveBeenCalledWith('user-1');
        expect(result).toEqual(mockRating);
      });

      it('should return null if user has no rating', async () => {
        mockSupportService.getUserRating.mockResolvedValue(null);

        const result = await controller.getUserRating(mockRequest);

        expect(result).toBeNull();
      });
    });
  });

  // ==================== Reports Endpoints ====================
  describe('Reports Management', () => {
    describe('GET /settings/reports', () => {
      it('should return paginated reports', async () => {
        const mockResult = {
          data: [{ id: 'report-1', name: 'Test Report' }],
          total: 1,
          page: 1,
          limit: 10,
        };
        mockReportsService.getReports.mockResolvedValue(mockResult);

        const result = await controller.getReports(mockRequest, { page: 1, limit: 10 });

        expect(mockReportsService.getReports).toHaveBeenCalledWith('org-1', { page: 1, limit: 10 });
        expect(result).toEqual(mockResult);
      });
    });

    describe('GET /settings/reports/types', () => {
      it('should return report types', () => {
        const mockTypes = [
          { type: ReportType.PACKAGES, name: 'Packages Report' },
        ];
        mockReportsService.getReportTypes.mockReturnValue(mockTypes);

        const result = controller.getReportTypes();

        expect(mockReportsService.getReportTypes).toHaveBeenCalled();
        expect(result).toEqual(mockTypes);
      });
    });

    describe('GET /settings/reports/quick-stats', () => {
      it('should return quick stats', async () => {
        const mockStats = { totalReports: 10, scheduledReports: 3 };
        mockReportsService.getQuickStats.mockResolvedValue(mockStats);

        const result = await controller.getQuickStats(mockRequest);

        expect(mockReportsService.getQuickStats).toHaveBeenCalledWith('org-1');
        expect(result).toEqual(mockStats);
      });
    });

    describe('GET /settings/reports/:id', () => {
      it('should return a single report', async () => {
        const mockReport = { id: 'report-1', name: 'Test Report' };
        mockReportsService.getReport.mockResolvedValue(mockReport);

        const result = await controller.getReport(mockRequest, 'report-1');

        expect(mockReportsService.getReport).toHaveBeenCalledWith('report-1', 'org-1');
        expect(result).toEqual(mockReport);
      });
    });

    describe('POST /settings/reports', () => {
      it('should create a report', async () => {
        const createDto = {
          name: 'New Report',
          reportType: ReportType.PACKAGES,
        };
        const mockCreated = { id: 'report-new', ...createDto };
        mockReportsService.createReport.mockResolvedValue(mockCreated);

        const result = await controller.createReport(mockRequest, createDto);

        expect(mockReportsService.createReport).toHaveBeenCalledWith('org-1', createDto, 'user-1');
        expect(result).toEqual(mockCreated);
      });
    });

    describe('PUT /settings/reports/:id', () => {
      it('should update a report', async () => {
        const updateDto = { name: 'Updated Report Name' };
        const mockUpdated = { id: 'report-1', name: 'Updated Report Name' };
        mockReportsService.updateReport.mockResolvedValue(mockUpdated);

        const result = await controller.updateReport(mockRequest, 'report-1', updateDto);

        expect(mockReportsService.updateReport).toHaveBeenCalledWith('report-1', 'org-1', updateDto, 'user-1');
        expect(result).toEqual(mockUpdated);
      });
    });

    describe('DELETE /settings/reports/:id', () => {
      it('should delete a report', async () => {
        mockReportsService.deleteReport.mockResolvedValue(undefined);

        await controller.deleteReport(mockRequest, 'report-1');

        expect(mockReportsService.deleteReport).toHaveBeenCalledWith('report-1', 'org-1', 'user-1');
      });
    });

    describe('POST /settings/reports/:id/generate', () => {
      it('should generate report data', async () => {
        const options = {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          format: 'pdf' as const,
        };
        const mockData = { data: [], generatedAt: new Date().toISOString() };
        mockReportsService.generateReportData.mockResolvedValue(mockData);

        const result = await controller.generateReport(mockRequest, 'report-1', options);

        expect(mockReportsService.generateReportData).toHaveBeenCalledWith('report-1', 'org-1', options, 'user-1');
        expect(result).toEqual(mockData);
      });

      it('should throw NotFoundException for non-existent report', async () => {
        mockReportsService.generateReportData.mockRejectedValue(new NotFoundException('Report not found'));

        await expect(controller.generateReport(mockRequest, 'non-existent', {})).rejects.toThrow(NotFoundException);
      });
    });
  });

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    it('should propagate service NotFoundException', async () => {
      mockContactsService.getContact.mockRejectedValue(new NotFoundException('Contact not found'));

      await expect(controller.getContact(mockRequest, 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should propagate service BadRequestException', async () => {
      mockBlacklistService.addToBlacklist.mockRejectedValue(new BadRequestException('Already blacklisted'));

      await expect(controller.addToBlacklist(mockRequest, {
        type: BlacklistType.CARRIER,
        name: 'Test',
        reason: 'Test',
      })).rejects.toThrow(BadRequestException);
    });

    it('should propagate generic errors', async () => {
      mockReportsService.getReports.mockRejectedValue(new Error('Database error'));

      await expect(controller.getReports(mockRequest, {})).rejects.toThrow(Error);
    });
  });

  // ==================== Authorization Context ====================
  describe('Authorization Context', () => {
    it('should pass user context to contacts service', async () => {
      mockContactsService.createContact.mockResolvedValue({ id: 'contact-1' });

      await controller.createContact(mockRequest, {
        name: 'Test',
        type: ContactType.CARRIER,
      });

      expect(mockContactsService.createContact).toHaveBeenCalledWith(
        'org-1',
        expect.any(Object),
        'user-1',
      );
    });

    it('should pass admin context to support service', async () => {
      mockSupportService.getTickets.mockResolvedValue({ data: [], total: 0 });

      await controller.getTickets(mockAdminRequest, {});

      expect(mockSupportService.getTickets).toHaveBeenCalledWith(
        'admin-1',
        expect.any(Object),
        true,
        'org-1',
      );
    });

    it('should use user ID for linked devices', async () => {
      mockLinkedDevicesService.getLinkedDevices.mockResolvedValue({ data: [], total: 0 });

      await controller.getLinkedDevices(mockRequest, {});

      expect(mockLinkedDevicesService.getLinkedDevices).toHaveBeenCalledWith('user-1', expect.any(Object));
    });
  });
});
