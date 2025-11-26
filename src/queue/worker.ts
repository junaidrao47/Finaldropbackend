import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Logger } from '@nestjs/common';
import { pool } from '../drizzle/drizzle-client';

const logger = new Logger('QueueWorker');
const REDIS = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(REDIS);

const worker = new Worker(
  'uploads',
  async (job) => {
    logger.log(`Worker processing job ${job.id} name=${job.name}`);
    const d = job.data || {};

    // Mark receive as processing (if DB available)
    try {
      if (pool) {
        await pool.query('UPDATE receives SET status = $1, updated_at = now() WHERE id = $2', ['processing', d.receiveId]);
      }
    } catch (err: any) {
      logger.warn('Failed to mark receive processing: ' + (err?.message || err));
    }

    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));
    // Simulate OCR + upload processing delay
    await wait(5000 + Math.floor(Math.random() * 5000));

    // Simulate success and update DB
    try {
      if (pool) {
        await pool.query('UPDATE receives SET status = $1, updated_at = now() WHERE id = $2', ['done', d.receiveId]);
      }
    } catch (err: any) {
      logger.error('Failed to mark receive done: ' + (err?.message || err));
    }

    logger.log(`Worker finished job ${job.id}`);
    return { ok: true, processedAt: new Date().toISOString() };
  },
  { connection, concurrency: 2 },
);

worker.on('completed', (job) => {
  logger.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed: ${err?.message || err}`);
});

process.on('SIGINT', async () => {
  await worker.close();
  await connection.quit();
  if (pool) await pool.end();
  process.exit(0);
});
