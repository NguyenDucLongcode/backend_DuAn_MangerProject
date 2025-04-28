import { PartialType } from '@nestjs/mapped-types';
import { AssignGroupLeaderDto } from './assign-group-leader.dto';

export class ChangeGroupLeaderDto extends PartialType(AssignGroupLeaderDto) {}
