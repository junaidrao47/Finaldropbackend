import { NotFoundException } from '@nestjs/common';
import { ReportsService } from './src/settings/reports.service';
import { ReportType } from './src/settings/dto/settings-extended.dto';

// Create mock db helper
function createMockDb() {
  return {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };
}

describe('ReportsService', () => {
  let service: ReportsService;
  let mockDb: ReturnType<typeof createMockDb>;

  const mockOrganizationId = 'org-1';
  const mockUserId = 'user-1';

  const mockReport = {
    id: 'report-1',
    organizationId: mockOrganizationId,
    name: 'Monthly Package Report',
    reportType: 'packages' as ReportType,
    parameters: JSON.stringify({ includeReturns: true }),
    schedule: JSON.stringify({ frequency: 'monthly', dayOfMonth: 1 }),
    isScheduled: true,
    lastGeneratedAt: new Date('2024-01-15'),
    fileUrl: null,
    createdBy: mockUserId,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    updatedBy: mockUserId,
    isDeleted: false,
  };

  beforeEach(() => {
    mockDb = createMockDb();
    service = new ReportsService(mockDb as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getReports', () => {
    it('should return paginated reports with default filters', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([mockReport]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getReports(mockOrganizationId, {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should filter by report type', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([mockReport]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getReports(mockOrganizationId, {
        reportType: ReportType.PACKAGES,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].reportType).toBe('packages');
    });

    it('should filter by isScheduled', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([mockReport]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getReports(mockOrganizationId, {
        isScheduled: true,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].isScheduled).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 50 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([mockReport]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getReports(mockOrganizationId, {
        page: 2,
        limit: 10,
      });

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5);
    });

    it('should return empty result when no reports exist', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getReports(mockOrganizationId, {});

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getReport', () => {
    it('should return a single report by ID', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockReport]),
        }),
      });

      const result = await service.getReport('report-1', mockOrganizationId);

      expect(result.id).toBe('report-1');
      expect(result.name).toBe('Monthly Package Report');
    });

    it('should throw NotFoundException for non-existent report', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.getReport('non-existent', mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReport', () => {
    const createDto = {
      name: 'New Report',
      reportType: ReportType.PACKAGES,
      parameters: { includeReturns: true },
      schedule: {
        frequency: 'weekly' as const,
        time: '09:00',
        recipients: ['admin@example.com'],
      },
      isScheduled: true,
    };

    it('should create a new report successfully', async () => {
      const createdReport = {
        ...mockReport,
        name: createDto.name,
        reportType: createDto.reportType,
        parameters: JSON.stringify(createDto.parameters),
        schedule: JSON.stringify(createDto.schedule),
        isScheduled: createDto.isScheduled,
        id: 'report-new',
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdReport]),
        }),
      });

      const result = await service.createReport(mockOrganizationId, createDto, mockUserId);

      expect(result.name).toBe('New Report');
      expect(result.reportType).toBe('packages');
    });

    it('should handle optional parameters', async () => {
      const minimalDto = {
        name: 'Simple Report',
        reportType: ReportType.CARRIERS,
      };
      const createdReport = {
        ...mockReport,
        ...minimalDto,
        id: 'report-minimal',
        parameters: null,
        schedule: null,
        isScheduled: false,
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdReport]),
        }),
      });

      const result = await service.createReport(mockOrganizationId, minimalDto, mockUserId);

      expect(result.name).toBe('Simple Report');
      expect(result.parameters).toBeUndefined();
      expect(result.schedule).toBeUndefined();
    });

    it('should set isScheduled to false by default', async () => {
      const dto = {
        name: 'Manual Report',
        reportType: ReportType.PERFORMANCE,
      };
      const createdReport = { ...mockReport, ...dto, isScheduled: false };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdReport]),
        }),
      });

      const result = await service.createReport(mockOrganizationId, dto, mockUserId);

      expect(result.isScheduled).toBe(false);
    });

    it('should handle all report types', async () => {
      for (const reportType of [ReportType.PACKAGES, ReportType.CARRIERS, ReportType.PERFORMANCE, ReportType.ACTIVITY, ReportType.CUSTOM]) {
        const dto = { name: `${reportType} Report`, reportType };
        const createdReport = { ...mockReport, ...dto };

        mockDb.insert.mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([createdReport]),
          }),
        });

        const result = await service.createReport(mockOrganizationId, dto, mockUserId);
        expect(result.reportType).toBe(reportType);
      }
    });
  });

  describe('updateReport', () => {
    const updateDto = {
      name: 'Updated Report Name',
      isScheduled: false,
    };

    it('should update an existing report', async () => {
      const updatedReport = { ...mockReport, ...updateDto };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockReport]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedReport]),
          }),
        }),
      });

      const result = await service.updateReport('report-1', mockOrganizationId, updateDto, mockUserId);

      expect(result.name).toBe('Updated Report Name');
      expect(result.isScheduled).toBe(false);
    });

    it('should throw NotFoundException when updating non-existent report', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.updateReport('non-existent', mockOrganizationId, updateDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update parameters', async () => {
      const paramsUpdate = { parameters: { newParam: 'value' } };
      const updatedReport = {
        ...mockReport,
        parameters: JSON.stringify({ newParam: 'value' }),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockReport]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedReport]),
          }),
        }),
      });

      const result = await service.updateReport('report-1', mockOrganizationId, paramsUpdate, mockUserId);

      expect(result.parameters).toEqual({ newParam: 'value' });
    });

    it('should update schedule', async () => {
      const scheduleUpdate = {
        schedule: {
          frequency: 'daily' as const,
          time: '10:00',
          recipients: ['user@example.com'],
        },
      };
      const updatedReport = {
        ...mockReport,
        schedule: JSON.stringify({ frequency: 'daily', time: '10:00', recipients: ['user@example.com'] }),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockReport]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedReport]),
          }),
        }),
      });

      const result = await service.updateReport('report-1', mockOrganizationId, scheduleUpdate, mockUserId);

      expect(result.schedule).toEqual({ frequency: 'daily', time: '10:00', recipients: ['user@example.com'] });
    });
  });

  describe('deleteReport', () => {
    it('should soft delete a report', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockReport]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await expect(
        service.deleteReport('report-1', mockOrganizationId, mockUserId),
      ).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when deleting non-existent report', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.deleteReport('non-existent', mockOrganizationId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateReportData', () => {
    const generateOptions = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      format: 'csv' as const,
    };

    it('should generate packages report data', async () => {
      const packagesReport = { ...mockReport, reportType: 'packages' };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([packagesReport]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.generateReportData(
        'report-1',
        mockOrganizationId,
        generateOptions,
        mockUserId,
      );

      expect(result.reportId).toBe('report-1');
      expect(result.format).toBe('csv');
      expect(result.data).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should generate carriers report data', async () => {
      const carriersReport = { ...mockReport, reportType: 'carriers' };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([carriersReport]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.generateReportData(
        'report-1',
        mockOrganizationId,
        generateOptions,
        mockUserId,
      );

      expect(result.summary).toHaveProperty('totalCarriers');
    });

    it('should generate performance report data', async () => {
      const perfReport = { ...mockReport, reportType: 'performance' };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([perfReport]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.generateReportData(
        'report-1',
        mockOrganizationId,
        generateOptions,
        mockUserId,
      );

      expect(result.summary).toHaveProperty('averageProcessingTime');
    });

    it('should generate activity report data', async () => {
      const activityReport = { ...mockReport, reportType: 'activity' };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([activityReport]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.generateReportData(
        'report-1',
        mockOrganizationId,
        generateOptions,
        mockUserId,
      );

      expect(result.summary).toHaveProperty('totalActions');
    });

    it('should use default dates when not provided', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockReport]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.generateReportData(
        'report-1',
        mockOrganizationId,
        {},
        mockUserId,
      );

      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException for non-existent report', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.generateReportData('non-existent', mockOrganizationId, generateOptions, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update lastGeneratedAt after generation', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockReport]),
        }),
      });

      const updateMock = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });
      mockDb.update.mockImplementation(updateMock);

      await service.generateReportData('report-1', mockOrganizationId, generateOptions, mockUserId);

      expect(updateMock).toHaveBeenCalled();
    });
  });

  describe('getQuickStats', () => {
    it('should return quick stats for reports overview', async () => {
      const result = await service.getQuickStats(mockOrganizationId);

      expect(result).toHaveProperty('packages');
      expect(result).toHaveProperty('carriers');
      expect(result).toHaveProperty('performance');
      expect(result.packages).toHaveProperty('today');
      expect(result.packages).toHaveProperty('week');
      expect(result.packages).toHaveProperty('month');
    });
  });

  describe('getReportTypes', () => {
    it('should return available report types', () => {
      const reportTypes = service.getReportTypes();

      expect(reportTypes.length).toBeGreaterThan(0);
      expect(reportTypes[0]).toHaveProperty('id');
      expect(reportTypes[0]).toHaveProperty('name');
      expect(reportTypes[0]).toHaveProperty('description');
    });

    it('should include all report types', () => {
      const reportTypes = service.getReportTypes();
      const typeIds = reportTypes.map((t) => t.id);

      expect(typeIds).toContain('packages');
      expect(typeIds).toContain('carriers');
      expect(typeIds).toContain('performance');
      expect(typeIds).toContain('activity');
      expect(typeIds).toContain('custom');
    });
  });

  describe('Response Mapping', () => {
    it('should correctly map database record to response DTO', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockReport]),
        }),
      });

      const result = await service.getReport('report-1', mockOrganizationId);

      expect(result).toMatchObject({
        id: mockReport.id,
        name: mockReport.name,
        reportType: mockReport.reportType,
        isScheduled: mockReport.isScheduled,
      });
      expect(result.parameters).toEqual({ includeReturns: true });
      expect(result.schedule).toEqual({ frequency: 'monthly', dayOfMonth: 1 });
    });

    it('should handle null values correctly', async () => {
      const reportWithNulls = {
        ...mockReport,
        parameters: null,
        schedule: null,
        lastGeneratedAt: null,
        fileUrl: null,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([reportWithNulls]),
        }),
      });

      const result = await service.getReport('report-1', mockOrganizationId);

      expect(result.parameters).toBeUndefined();
      expect(result.schedule).toBeUndefined();
      expect(result.lastGeneratedAt).toBeUndefined();
      expect(result.fileUrl).toBeUndefined();
    });
  });
});
