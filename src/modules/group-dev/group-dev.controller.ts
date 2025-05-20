import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { GroupDevService } from './group-dev.service';

import {
  CreateGroupDevDto,
  UpdateGroupDevDto,
  PaginationGroupDevDto,
} from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileAvatarFilter } from '@/cloudinary/filter/filter.user.avatar';

@Controller('group-dev')
export class GroupDevController {
  constructor(private readonly groupDevService: GroupDevService) {}

  @Post('create')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1 },
      fileFilter: imageFileAvatarFilter,
    }),
  )
  create(
    @Body() createGroupDevDto: CreateGroupDevDto,
    @UploadedFile() file?: MulterFile,
  ) {
    return this.groupDevService.createGroupDev(createGroupDevDto, file);
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
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1 },
      fileFilter: imageFileAvatarFilter,
    }),
  )
  update(
    @Query('id') id: string,
    @Body() updateGroupDevDto: UpdateGroupDevDto,
    @UploadedFile() file?: MulterFile,
  ) {
    return this.groupDevService.updateGroupDev(id, updateGroupDevDto, file);
  }

  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.groupDevService.removeGroupDev(id);
  }
}
