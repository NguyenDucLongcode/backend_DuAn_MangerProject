import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Controller('messages')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('create')
  async sendMessage(@Body() createChatDto: CreateChatDto) {
    const { senderId, receiverId, groupId, content } = createChatDto;

    // Check senderId exists in database
    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: senderId } }),
      this.prisma.user.findUnique({ where: { id: receiverId } }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('Sender hoặc Receiver không tồn tại');
    }

    if (groupId) {
      // Tin nhắn nhóm → kiểm tra group
      const existsGroup = await this.prisma.groupDev.findUnique({
        where: { id: groupId },
      });

      if (!existsGroup) {
        throw new NotFoundException('Group không tồn tại');
      }
    } else {
      // Tin nhắn cá nhân → kiểm tra receiver
      if (!receiver) {
        throw new NotFoundException('Receiver không tồn tại');
      }
    }
    // create message in database
    const message = await this.prisma.message.create({
      data: createChatDto,
    });

    // gửi qua socket
    if (receiverId) {
      await this.chatService.sendMessage(receiverId, {
        from: senderId,
        message: content,
        timestamp: new Date().toISOString(),
      });
    }

    return { message: 'Message sent', data: message };
  }

  @Get('private')
  async getPrivateMessages(
    @Query('userA') userA: string,
    @Query('userB') userB: string,
  ) {
    // Check senderId exists in database
    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userA } }),
      this.prisma.user.findUnique({ where: { id: userB } }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('1 trong 2 user không tồn tại');
    }
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    return { message: 'Message sent', data: messages };
  }

  @Get('group')
  async getGroupMessages(@Query('groupId') groupId: string) {
    // Check groupId exists in database
    const existsGroup = await this.prisma.groupDev.findUnique({
      where: { id: groupId },
    });

    if (!existsGroup) {
      throw new NotFoundException('Group không tồn tại');
    }

    const messages = await this.prisma.message.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
    });

    return { message: 'Get message success', data: messages };
  }

  @Get('')
  async findOneMessage(@Query('id') messageId: string) {
    // Check Message exists in database
    const existsGroup = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existsGroup) {
      throw new NotFoundException('Message không tồn tại');
    }

    const messages = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    return { message: 'Get message success', data: messages };
  }

  @Delete('delete')
  async removeMessage(@Query('id') id: string) {
    // check exits Notification
    const existingMessage = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      throw new NotFoundException(
        `Cannot delete. Messagen with id ${id} not found`,
      );
    }

    // Query DB
    await this.prisma.message.delete({
      where: { id },
    });

    return {
      message: 'Message deleted successfully',
    };
  }
}
