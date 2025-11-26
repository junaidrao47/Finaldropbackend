import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ReceivesService } from './receives.service';
import { CommitReceiveDto } from './dto/commit-receive.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('receives')
export class ReceivesController {
  constructor(private readonly service: ReceivesService) {}

  @Post('commit')
  @UseGuards(AuthGuard)
  async commit(@CurrentUser() user: any, @Body() body: CommitReceiveDto) {
    const res = await this.service.enqueueCommit(user, body);
    return res;
  }
}
