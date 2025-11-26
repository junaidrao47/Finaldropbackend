import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { DrizzleReceivesRepository, ReceiveWithRelations } from '../drizzle/repositories/receives.repository';
import { DrizzleMembershipsRepository } from '../drizzle/repositories/memberships.repository';

@Injectable()
export class ReceivesService {
  private readonly logger = new Logger(ReceivesService.name);

  constructor(
    private readonly queue: QueueService,
    private readonly receivesRepo: DrizzleReceivesRepository,
    private readonly membershipsRepo: DrizzleMembershipsRepository,
  ) {}

  async enqueueCommit(user: any, payload: any) {
    const orgId = payload.organizationId || user.activeOrganizationId || null;

    // Validate membership if organization provided
    if (orgId) {
      const isMember = await this.membershipsRepo.checkMembership(user.id, orgId);
      if (!isMember) {
        throw new ForbiddenException('User is not a member of the specified organization');
      }
    }

    // Persist receive via Drizzle
    const receive = await this.receivesRepo.create({
      organizationId: orgId,
      userId: user.id,
      metadata: payload.metadata || null,
      status: 'pending',
    });

    // Enqueue a small job payload with receive id and file metadata
    const job = await this.queue.addJob(
      'uploads',
      'commit',
      { receiveId: receive.id, files: payload.files },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
    );

    this.logger.log(`Enqueued receive id=${receive.id} job=${job.id}`);

    return { jobId: job.id, receiveId: receive.id, status: 'queued' };
  }

  async findAll(): Promise<ReceiveWithRelations[]> {
    return this.receivesRepo.findAll();
  }

  async findOne(id: number): Promise<ReceiveWithRelations | null> {
    return this.receivesRepo.findById(id);
  }

  async findByUser(userId: number): Promise<ReceiveWithRelations[]> {
    return this.receivesRepo.findByUserId(userId);
  }

  async findByOrganization(organizationId: number): Promise<ReceiveWithRelations[]> {
    return this.receivesRepo.findByOrganizationId(organizationId);
  }

  async updateStatus(id: number, status: string): Promise<ReceiveWithRelations | null> {
    return this.receivesRepo.updateStatus(id, status);
  }
}
