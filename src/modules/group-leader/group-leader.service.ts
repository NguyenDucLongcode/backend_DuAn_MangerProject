import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignGroupLeaderDto } from './dto/assign-group-leader.dto';
import { ChangeGroupLeaderDto } from './dto/change-group-leader.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import {
  FindLeaderByGroupCacheSchema,
  FindLeaderCache,
} from '@/common/schemas/groupLeader/groupLeader-findLeader-cache.schema';

@Injectable()
export class GroupLeaderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async assignLeader(assignGroupLeaderDto: AssignGroupLeaderDto) {
    const { groupId, userId } = assignGroupLeaderDto;

    // check user is Leader
    const isLeaderUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        role: 'LEADER',
      },
    });

    if (!isLeaderUser) {
      throw new NotFoundException(
        'User is not leader, please choose another id',
      );
    }

    // check group already exists in database
    const existsGroup = await this.prisma.groupDev.findUnique({
      where: {
        id: groupId,
      },
    });

    if (!existsGroup) {
      throw new NotFoundException(
        'Group dev not found, please choose another id',
      );
    }

    // Check if groupId already has a leader  in database. If so, throw an error.
    const existsAssignLeader = await this.prisma.groupLeader.findFirst({
      where: {
        groupId: groupId,
      },
    });

    if (existsAssignLeader) {
      throw new ConflictException('GroupId already has a leader');
    }

    // Query DB
    await this.prisma.groupLeader.create({
      data: {
        groupId: groupId,
        userId: userId,
      },
    });

    //delete key
    await this.redisService.delByPattern(
      'groupLeader:findLeaderByGroup:groupId=*',
    );

    // Return sussess result
    return {
      message: 'Assign success ',
    };
  }

  async findLeaderByGroup(groupId: string) {
    // cache
    const cacheKey = `groupLeader:findLeaderByGroup:groupId=${groupId}`;
    const cachedString = await this.redisService.get(cacheKey);

    // return result when key is in redis
    if (cachedString) {
      // data type casting when converting json
      const cached: FindLeaderCache = FindLeaderByGroupCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return {
        ...cached,
      };
    }

    const groupLeader = await this.prisma.groupLeader.findFirst({
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
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!groupLeader) {
      throw new NotFoundException('Leader for group not found');
    }

    const result = {
      message: 'Get information leader successfully',
      leader: groupLeader.user,
    };

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  async changeLeader(
    groupId: string,
    changeGroupLeaderDto: ChangeGroupLeaderDto,
  ) {
    // check group has been assign leader already exists in DB
    const existsGroupAssign = await this.prisma.groupLeader.findFirst({
      where: { groupId },
    });

    if (!existsGroupAssign) {
      throw new NotFoundException(
        'Group is not found , please choose another id',
      );
    }

    // check user is Leader
    const isLeaderUser = await this.prisma.user.findFirst({
      where: {
        id: changeGroupLeaderDto.userId,
        role: 'LEADER',
      },
    });

    if (!isLeaderUser) {
      throw new NotFoundException(
        'User is not leader, please choose another id',
      );
    }

    // Query DB
    await this.prisma.groupLeader.updateMany({
      where: { groupId },
      data: changeGroupLeaderDto,
    });

    //delete key
    await this.redisService.delByPattern(
      'groupLeader:findLeaderByGroup:groupId=*',
    );

    // Return seccessfull result
    return {
      message: 'Change leader successfully',
    };
  }

  async removeLeader(groupId: string) {
    // Check group has leader
    const existsGroupLeader = await this.prisma.groupLeader.findFirst({
      where: { groupId },
    });

    if (!existsGroupLeader) {
      throw new NotFoundException('Group has no leader to remove');
    }

    // Delete leader
    await this.prisma.groupLeader.deleteMany({
      where: { groupId },
    });

    //delete key
    await this.redisService.delByPattern(
      'groupLeader:findLeaderByGroup:groupId=*',
    );

    return {
      message: 'Remove leader successfully',
    };
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
}
