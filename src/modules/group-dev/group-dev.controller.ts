import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { GroupDevService } from './group-dev.service';

import {
  CreateGroupDevDto,
  UpdateGroupDevDto,
  PaginationGroupDevDto,
} from './dto';

@Controller('group-dev')
export class GroupDevController {
  constructor(private readonly groupDevService: GroupDevService) {}

  @Post('create')
  create(@Body() createGroupDevDto: CreateGroupDevDto) {
    return this.groupDevService.createGroupDev(createGroupDevDto);
  }
  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationGroupDevDto) {
    return this.groupDevService.Pagination(paginationDto);
  }

  @Get()
  findOne(@Query('id') id: string) {
    return this.groupDevService.findOne(id);
  }

  @Patch('update')
  update(
    @Query('id') id: string,
    @Body() updateGroupDevDto: UpdateGroupDevDto,
  ) {
    return this.groupDevService.updateGroupDev(id, updateGroupDevDto);
  }

  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.groupDevService.removeGroupDev(id);
  }
}
