import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ReceivesController } from './receives.controller';
import { ReceivesService } from './receives.service';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    DrizzleModule,
    QueueModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute for read operations
      },
      {
        name: 'write',
        ttl: 60000,
        limit: 30, // 30 requests per minute for write operations
      },
      {
        name: 'bulk',
        ttl: 60000,
        limit: 10, // 10 requests per minute for bulk operations
      },
    ]),
  ],
  controllers: [ReceivesController],
  providers: [ReceivesService],
  exports: [ReceivesService],
})
export class ReceivesModule {}
