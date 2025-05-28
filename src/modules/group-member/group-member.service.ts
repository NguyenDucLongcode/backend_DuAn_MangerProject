import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JoinGroupMemberDto } from './dto/join-group-member.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import {
  ListMemberCache,
  ListMembersCacheSchema,
} from '@/common/schemas/groupMember/groupMember-listMembers-cache.schema';

@Injectable()
export class GroupMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async joinGroup(joinGroupMemberDto: JoinGroupMemberDto) {
    const { groupId, userId } = joinGroupMemberDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is Leader
    if (user.role !== 'CODER') {
      throw new ConflictException('Only coder join as a member');
    }

    // Check if group dev exists
    const group = await this.prisma.groupDev.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.maxMembers === null || group.maxMembers === undefined) {
      throw new ConflictException('Group maxMembers is not set');
    }

    // check number of group members
    const countMembers = await this.prisma.groupMember.count({
      where: { groupId },
    });

    if (countMembers >= group.maxMembers) {
      throw new ConflictException('The group is full.');
    }

    // Check if user has joined the group
    const isAlreadyMember = await this.prisma.groupMember.findFirst({
      where: { groupId, userId },
    });
    if (isAlreadyMember) {
      throw new ConflictException('User already joined this group');
    }

    //delete key
    await this.redisService.delByPattern(
      'groupMember:listMembersByGroup:groupId=*',
    );

    // add member
    await this.prisma.groupMember.create({
      data: { groupId, userId },
    });

    return { message: 'User joined group successfully' };
  }

  async listMembersByGroup(groupId: string) {
    // cache
    const cacheKey = `groupMember:listMembersByGroup:groupId=${groupId}`;
    const cachedString = await this.redisService.get(cacheKey);

    // return result when key is in redis
    if (cachedString) {
      // data type casting when converting json
      const cached: ListMemberCache = ListMembersCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return {
        ...cached,
      };
    }

    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            gender: true,
            role: true,
            avatar_url: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    //  "map" lại cho flatten:
    const flatMembers = members.map((m) => m.user);

    const result = {
      message: 'Get list member successfully',
      members: flatMembers,
    };

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  async leaveGroup(groupId: string, userId: string) {
    // Check if user is in group
    const isMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!isMember) {
      throw new NotFoundException('User is not a member of this group');
    }

    const isLeader = await this.isLeaderInGroup(groupId, userId);
    if (isLeader) {
      const leaderCount = await this.countLeaders(groupId);
      if (leaderCount <= 1) {
        throw new BadRequestException(
          'Không thể xóa vì dây là leader duy nhất',
        );
      }
    }

    //delete key
    await this.redisService.delByPattern(
      'groupMember:listMembersByGroup:groupId=*',
    );

    // delete member
    await this.prisma.groupMember.delete({
      where: { id: isMember.id },
    });

    return { message: 'User left group successfully' };
  }

  async isUserInGroup(groupId: string, userId: string): Promise<boolean> {
    const existingGroupDev = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    return !!existingGroupDev; // true nếu là thành viên
  }

  async isLeaderInGroup(groupId: string, userId: string) {
    // check group dev exists by id
    const existingGroupDev = await this.prisma.groupLeader.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    return !!existingGroupDev; // true nếu là leader
  }

  async countLeaders(groupId: string): Promise<number> {
    return this.prisma.groupLeader.count({
      where: { groupId },
    });
  }
}
