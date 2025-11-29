import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContactsService } from './contacts.service';
import {
  CreateChatSessionDto,
  CreateChatMessageDto,
  UpdateChatSessionDto,
  ChatSessionFilterDto,
  AiQueryDto,
  EscalationRequestDto,
} from './dto/contact.dto';

@Controller('contacts')
@UseGuards(AuthGuard('jwt'))
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  /**
   * Create a new chat session
   * POST /contacts/sessions
   */
  @Post('sessions')
  async createSession(@Body() dto: CreateChatSessionDto, @Request() req: any) {
    // If no customerId provided, use current user
    if (!dto.customerId && req.user) {
      dto.customerId = req.user.id;
    }
    return this.contactsService.createSession(dto);
  }

  /**
   * Get chat session by ID
   * GET /contacts/sessions/:id
   */
  @Get('sessions/:id')
  async getSession(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.getSession(id);
  }

  /**
   * Update chat session
   * PUT /contacts/sessions/:id
   */
  @Put('sessions/:id')
  async updateSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChatSessionDto,
  ) {
    return this.contactsService.updateSession(id, dto);
  }

  /**
   * List chat sessions with filters
   * GET /contacts/sessions
   */
  @Get('sessions')
  async listSessions(@Query() filter: ChatSessionFilterDto) {
    return this.contactsService.listSessions(filter);
  }

  /**
   * Get my chat sessions (as customer)
   * GET /contacts/my-sessions
   */
  @Get('my-sessions')
  async getMySessions(@Request() req: any, @Query() filter: ChatSessionFilterDto) {
    return this.contactsService.listSessions({
      ...filter,
      customerId: req.user.id,
    });
  }

  /**
   * Get assigned sessions (for agents)
   * GET /contacts/assigned-sessions
   */
  @Get('assigned-sessions')
  async getAssignedSessions(@Request() req: any, @Query() filter: ChatSessionFilterDto) {
    return this.contactsService.listSessions({
      ...filter,
      assignedAgentId: req.user.id,
    });
  }

  /**
   * Send a message in a chat session
   * POST /contacts/messages
   */
  @Post('messages')
  async sendMessage(@Body() dto: CreateChatMessageDto, @Request() req: any) {
    return this.contactsService.addMessage(dto, req.user?.id);
  }

  /**
   * Get messages for a session
   * GET /contacts/sessions/:id/messages
   */
  @Get('sessions/:id/messages')
  async getMessages(
    @Param('id', ParseIntPipe) sessionId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contactsService.getMessages(sessionId, page, limit);
  }

  /**
   * Send query to AI assistant
   * POST /contacts/ai/query
   */
  @Post('ai/query')
  async aiQuery(@Body() dto: AiQueryDto) {
    return this.contactsService.processAiQuery(dto);
  }

  /**
   * Escalate session to human agent
   * POST /contacts/sessions/:id/escalate
   */
  @Post('sessions/:id/escalate')
  async escalateSession(
    @Param('id', ParseIntPipe) sessionId: number,
    @Body() dto: EscalationRequestDto,
    @Request() req: any,
  ) {
    dto.sessionId = sessionId;
    return this.contactsService.escalateSession(dto, req.user.id);
  }

  /**
   * Resolve a chat session
   * POST /contacts/sessions/:id/resolve
   */
  @Post('sessions/:id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveSession(
    @Param('id', ParseIntPipe) sessionId: number,
    @Body('resolutionNotes') resolutionNotes?: string,
  ) {
    return this.contactsService.resolveSession(sessionId, resolutionNotes);
  }

  /**
   * Get support statistics
   * GET /contacts/stats
   */
  @Get('stats')
  async getStats(@Query('organizationId') organizationId?: number) {
    return this.contactsService.getStats(organizationId);
  }

  /**
   * Mark messages as read
   * POST /contacts/sessions/:id/read
   */
  @Post('sessions/:id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(
    @Param('id', ParseIntPipe) sessionId: number,
    @Body('messageIds') messageIds?: number[],
  ) {
    await this.contactsService.markMessagesRead(sessionId, messageIds);
    return { success: true };
  }
}
