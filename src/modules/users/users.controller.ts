import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';

// DTO
import { CreateUserDto, PaginationDto, UpdateUserDto } from './dto';

// multer
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileAvatarFilter } from '@/cloudinary/filter/filter.user.avatar';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1 },
      fileFilter: imageFileAvatarFilter,
    }),
  )
  create(
    @Body()
    createUserDto: CreateUserDto,
    @UploadedFile() file?: MulterFile,
  ) {
    return this.usersService.create(createUserDto, file);
  }

  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationDto) {
    return this.usersService.Pagination(paginationDto);
  }

  @Get()
  findOne(@Query('id') id: string) {
    return this.usersService.findOne(id);
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
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: MulterFile,
  ) {
    return this.usersService.update(id, updateUserDto, file);
  }

  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.usersService.remove(id);
  }
}
