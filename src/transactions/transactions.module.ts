import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [DrizzleModule, QueueModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
