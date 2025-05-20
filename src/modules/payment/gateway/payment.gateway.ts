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
import { PaymentGatewayService } from './payment.gateway.service';

@WebSocketGateway({ cors: true })
export class PaymentGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  // constructor
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}

  afterInit(server: Server) {
    this.paymentGatewayService.bindServer(server);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    await this.paymentGatewayService.removeSocket(client.id);
  }

  @SubscribeMessage('register')
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    const user = await this.paymentGatewayService.findUserById(userId);
    if (!user) {
      client.emit('registered', {
        success: false,
        message: 'User không hợp lệ',
      });
      return;
    }

    await this.paymentGatewayService.registerSocket(userId, client.id);
    client.emit('registered', { success: true });
  }
}
