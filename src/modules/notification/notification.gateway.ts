import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';

@WebSocketGateway({ cors: true })
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  // constructor
  constructor(private readonly notificationService: NotificationService) {}

  afterInit(server: Server) {
    this.notificationService.bindServer(server);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    await this.notificationService.removeSocket(client.id);
  }

  @SubscribeMessage('register')
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    const user = await this.notificationService.findUserById(userId);
    if (!user) {
      client.emit('registered', {
        success: false,
        message: 'User không hợp lệ',
      });
      return;
    }

    await this.notificationService.registerSocket(userId, client.id);
    client.emit('registered', { success: true });
  }
}
