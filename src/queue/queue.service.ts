import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, QueueOptions, Job } from 'bullmq';
import IORedis from 'ioredis';

const DEFAULT_REDIS = process.env.REDIS_URL || 'redis://localhost:6379';

// Queue names
export const QUEUE_NAMES = {
  PACKAGE_PROCESSING: 'package-processing',
  NOTIFICATIONS: 'notifications',
  OCR_SCANNING: 'ocr-scanning',
  FILE_UPLOADS: 'file-uploads',
  REPORTS: 'reports',
  EMAIL: 'email',
} as const;

// Job types
export const JOB_TYPES = {
  // Package processing jobs
  PROCESS_RECEIVE: 'process-receive',
  PROCESS_DELIVER: 'process-deliver',
  PROCESS_RETURN: 'process-return',
  PROCESS_TRANSFER: 'process-transfer',
  BULK_STATUS_UPDATE: 'bulk-status-update',
  
  // Notification jobs
  SEND_DELIVERY_NOTIFICATION: 'send-delivery-notification',
  SEND_PACKAGE_RECEIVED: 'send-package-received',
  SEND_PACKAGE_AVAILABLE: 'send-package-available',
  
  // OCR jobs
  SCAN_SHIPPING_LABEL: 'scan-shipping-label',
  BATCH_SCAN: 'batch-scan',
  
  // File jobs
  UPLOAD_TO_STORAGE: 'upload-to-storage',
  COMPRESS_IMAGE: 'compress-image',
  
  // Report jobs
  GENERATE_DAILY_REPORT: 'generate-daily-report',
  GENERATE_INVENTORY_REPORT: 'generate-inventory-report',
  EXPORT_PACKAGES: 'export-packages',
  
  // Email jobs
  SEND_EMAIL: 'send-email',
  SEND_BULK_EMAIL: 'send-bulk-email',
} as const;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: IORedis;
  private queues = new Map<string, Queue>();

  onModuleInit() {
    this.logger.log('Initializing QueueService');
    this.connection = new IORedis(DEFAULT_REDIS);
  }

  getQueue(name: string): Queue {
    if (this.queues.has(name)) return this.queues.get(name) as Queue;

    const opts: QueueOptions = { connection: this.connection };
    const q = new Queue(name, opts);
    this.queues.set(name, q);
    this.logger.log(`Created queue '${name}'`);
    return q;
  }

  async addJob(name: string, jobName: string, data: any, opts?: any) {
    const q = this.getQueue(name);
    const job = await q.add(jobName, data, opts);
    this.logger.debug(`Enqueued job ${job.id} on queue ${name}`);
    return job;
  }

  // ==================== Package Processing Jobs ====================

  /**
   * Queue a receive transaction for processing
   */
  async queueReceive(data: {
    packageId: string;
    organizationId: string;
    warehouseId?: string;
    userId: string;
    trackingNumber: string;
  }) {
    return this.addJob(
      QUEUE_NAMES.PACKAGE_PROCESSING,
      JOB_TYPES.PROCESS_RECEIVE,
      data,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  /**
   * Queue a delivery transaction for processing
   */
  async queueDeliver(data: {
    packageId: string;
    organizationId: string;
    userId: string;
    recipientName?: string;
    signature?: string;
  }) {
    return this.addJob(
      QUEUE_NAMES.PACKAGE_PROCESSING,
      JOB_TYPES.PROCESS_DELIVER,
      data,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  /**
   * Queue a return transaction for processing
   */
  async queueReturn(data: {
    packageId: string;
    organizationId: string;
    userId: string;
    reason?: string;
  }) {
    return this.addJob(
      QUEUE_NAMES.PACKAGE_PROCESSING,
      JOB_TYPES.PROCESS_RETURN,
      data,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  /**
   * Queue bulk status update
   */
  async queueBulkStatusUpdate(data: {
    packageIds: string[];
    newStatus: string;
    organizationId: string;
    userId: string;
  }) {
    return this.addJob(
      QUEUE_NAMES.PACKAGE_PROCESSING,
      JOB_TYPES.BULK_STATUS_UPDATE,
      data,
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 2000 },
      },
    );
  }

  // ==================== Notification Jobs ====================

  /**
   * Queue delivery notification
   */
  async queueDeliveryNotification(data: {
    packageId: string;
    recipientEmail?: string;
    recipientPhone?: string;
    organizationId: string;
  }) {
    return this.addJob(
      QUEUE_NAMES.NOTIFICATIONS,
      JOB_TYPES.SEND_DELIVERY_NOTIFICATION,
      data,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  /**
   * Queue package received notification
   */
  async queueReceivedNotification(data: {
    packageId: string;
    recipientEmail?: string;
    recipientPhone?: string;
    organizationId: string;
    trackingNumber: string;
  }) {
    return this.addJob(
      QUEUE_NAMES.NOTIFICATIONS,
      JOB_TYPES.SEND_PACKAGE_RECEIVED,
      data,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  // ==================== OCR Jobs ====================

  /**
   * Queue OCR scan job
   */
  async queueOcrScan(data: {
    imageBase64: string;
    organizationId: string;
    warehouseId?: string;
    userId: string;
  }) {
    return this.addJob(
      QUEUE_NAMES.OCR_SCANNING,
      JOB_TYPES.SCAN_SHIPPING_LABEL,
      data,
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: true,
      },
    );
  }

  // ==================== File Upload Jobs ====================

  /**
   * Queue file upload to cloud storage
   */
  async queueFileUpload(data: {
    fileBase64: string;
    fileName: string;
    fileType: string;
    packageId?: string;
    organizationId: string;
  }) {
    return this.addJob(
      QUEUE_NAMES.FILE_UPLOADS,
      JOB_TYPES.UPLOAD_TO_STORAGE,
      data,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }

  // ==================== Report Jobs ====================

  /**
   * Queue daily report generation
   */
  async queueDailyReport(data: {
    organizationId: string;
    date: string;
    recipientEmail: string;
  }) {
    return this.addJob(
      QUEUE_NAMES.REPORTS,
      JOB_TYPES.GENERATE_DAILY_REPORT,
      data,
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
      },
    );
  }

  /**
   * Queue package export job
   */
  async queuePackageExport(data: {
    organizationId: string;
    filters: Record<string, any>;
    format: 'csv' | 'xlsx' | 'json';
    recipientEmail: string;
  }) {
    return this.addJob(
      QUEUE_NAMES.REPORTS,
      JOB_TYPES.EXPORT_PACKAGES,
      data,
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
      },
    );
  }

  // ==================== Email Jobs ====================

  /**
   * Queue email sending
   */
  async queueEmail(data: {
    to: string;
    subject: string;
    template: string;
    templateData: Record<string, any>;
  }) {
    return this.addJob(
      QUEUE_NAMES.EMAIL,
      JOB_TYPES.SEND_EMAIL,
      data,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  // ==================== Queue Stats ====================

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string) {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    const stats = await Promise.all(
      Object.values(QUEUE_NAMES).map(name => this.getQueueStats(name)),
    );
    return stats;
  }

  /**
   * Get job by ID
   */
  async getJob(queueName: string, jobId: string): Promise<Job | undefined> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Retry failed job
   */
  async retryJob(queueName: string, jobId: string) {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.retry();
      return true;
    }
    return false;
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down QueueService');
    for (const q of this.queues.values()) {
      try {
        await q.close();
      } catch (err: any) {
        this.logger.warn('Error closing queue: ' + (err?.message || err));
      }
    }
    if (this.connection) {
      await this.connection.quit();
    }
  }
}
