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
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: true })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: Server) {
    this.chatService.bindServer(server);
  }

  handleConnection(client: Socket) {
    console.log(`Chat connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Chat disconnected: ${client.id}`);
    await this.chatService.removeSocket(client.id);
  }

  @SubscribeMessage('chat:register')
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    const user = await this.chatService.findUserById(userId);
    if (!user) {
      client.emit('chat:registered', {
        success: false,
        message: 'User không hợp lệ',
      });
      return;
    }

    await this.chatService.registerSocket(userId, client.id);
    client.emit('chat:registered', { success: true });
  }

  @SubscribeMessage('chat:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { senderId: string; receiverId: string; message: string },
  ) {
    const { senderId, receiverId, message } = payload;

    await this.chatService.sendMessage(receiverId, {
      from: senderId,
      message,
      timestamp: new Date().toISOString(),
    });

    client.emit('chat:sent', { success: true });
  }
}
