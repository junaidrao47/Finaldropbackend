import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { channel: string; userId?: number; organizationId?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = data.channel;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    return { event: 'subscribed', data: { channel: room } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { channel: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.channel);
    this.logger.log(`Client ${client.id} left room: ${data.channel}`);
    return { event: 'unsubscribed', data: { channel: data.channel } };
  }

  // Emit to specific room/channel
  emitToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  // Emit to all connected clients
  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Emit package status update
  emitPackageUpdate(organizationId: number, packageData: any) {
    this.emitToRoom(`org:${organizationId}`, 'package:update', packageData);
  }

  // Emit receive status update
  emitReceiveUpdate(organizationId: number, receiveData: any) {
    this.emitToRoom(`org:${organizationId}`, 'receive:update', receiveData);
  }

  // Emit authentication prompt to customer
  emitAuthPrompt(userId: number, promptData: any) {
    this.emitToRoom(`user:${userId}`, 'auth:prompt', promptData);
  }
}
