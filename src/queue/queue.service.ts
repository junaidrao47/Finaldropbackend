import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';

const DEFAULT_REDIS = process.env.REDIS_URL || 'redis://localhost:6379';

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
