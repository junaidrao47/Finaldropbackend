import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QueueService, QUEUE_NAMES } from './queue.service';

@Controller('queue')
@UseGuards(AuthGuard('jwt'))
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * Get all queue statistics
   * GET /queue/stats
   */
  @Get('stats')
  async getAllStats() {
    return this.queueService.getAllQueueStats();
  }

  /**
   * Get specific queue statistics
   * GET /queue/stats/:queueName
   */
  @Get('stats/:queueName')
  async getQueueStats(@Param('queueName') queueName: string) {
    return this.queueService.getQueueStats(queueName);
  }

  /**
   * Get available queue names
   * GET /queue/names
   */
  @Get('names')
  getQueueNames() {
    return {
      queues: Object.values(QUEUE_NAMES),
    };
  }

  /**
   * Get job details
   * GET /queue/:queueName/jobs/:jobId
   */
  @Get(':queueName/jobs/:jobId')
  async getJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    const job = await this.queueService.getJob(queueName, jobId);
    if (!job) {
      return { error: 'Job not found' };
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
    };
  }

  /**
   * Retry a failed job
   * POST /queue/:queueName/jobs/:jobId/retry
   */
  @Post(':queueName/jobs/:jobId/retry')
  async retryJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    const success = await this.queueService.retryJob(queueName, jobId);
    return { success, jobId };
  }

  // ==================== Queue Transaction Endpoints ====================

  /**
   * Queue a receive transaction
   * POST /queue/receive
   */
  @Post('receive')
  async queueReceive(@Body() data: any, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const job = await this.queueService.queueReceive({
      ...data,
      userId,
    });
    return { jobId: job.id, message: 'Receive job queued' };
  }

  /**
   * Queue a delivery transaction
   * POST /queue/deliver
   */
  @Post('deliver')
  async queueDeliver(@Body() data: any, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const job = await this.queueService.queueDeliver({
      ...data,
      userId,
    });
    return { jobId: job.id, message: 'Deliver job queued' };
  }

  /**
   * Queue a return transaction
   * POST /queue/return
   */
  @Post('return')
  async queueReturn(@Body() data: any, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const job = await this.queueService.queueReturn({
      ...data,
      userId,
    });
    return { jobId: job.id, message: 'Return job queued' };
  }

  /**
   * Queue bulk status update
   * POST /queue/bulk-status
   */
  @Post('bulk-status')
  async queueBulkStatus(@Body() data: any, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const job = await this.queueService.queueBulkStatusUpdate({
      ...data,
      userId,
    });
    return { jobId: job.id, message: 'Bulk status update job queued' };
  }

  /**
   * Queue OCR scan
   * POST /queue/ocr-scan
   */
  @Post('ocr-scan')
  async queueOcrScan(@Body() data: any, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const job = await this.queueService.queueOcrScan({
      ...data,
      userId,
    });
    return { jobId: job.id, message: 'OCR scan job queued' };
  }

  /**
   * Queue daily report
   * POST /queue/report/daily
   */
  @Post('report/daily')
  async queueDailyReport(@Body() data: any) {
    const job = await this.queueService.queueDailyReport(data);
    return { jobId: job.id, message: 'Daily report job queued' };
  }

  /**
   * Queue package export
   * POST /queue/export
   */
  @Post('export')
  async queueExport(@Body() data: any) {
    const job = await this.queueService.queuePackageExport(data);
    return { jobId: job.id, message: 'Export job queued' };
  }

  /**
   * Queue email
   * POST /queue/email
   */
  @Post('email')
  async queueEmail(@Body() data: any) {
    const job = await this.queueService.queueEmail(data);
    return { jobId: job.id, message: 'Email job queued' };
  }
}
