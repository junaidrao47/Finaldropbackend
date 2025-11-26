import { Module } from '@nestjs/common';
import { ReceivesController } from './receives.controller';
import { ReceivesService } from './receives.service';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [DrizzleModule, QueueModule],
  controllers: [ReceivesController],
  providers: [ReceivesService],
  exports: [ReceivesService],
})
export class ReceivesModule {}
