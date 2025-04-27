import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupDevDto } from './create-group-dev.dto';

export class UpdateGroupDevDto extends PartialType(CreateGroupDevDto) {}
