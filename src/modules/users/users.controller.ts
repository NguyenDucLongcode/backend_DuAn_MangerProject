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
import { MulterFile } from '@/types/multer-file';

// roles
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/enums/role.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/types/jwt-payload.interface';
import { checkPermissionForUser } from '@/common/utils/role/auth-utils';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
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

  @Roles(Role.ADMIN, Role.LEADER)
  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationDto) {
    return this.usersService.Pagination(paginationDto);
  }

  // @Roles(Role.ADMIN, Role.CODER, Role.CUSTOMER, Role.LEADER)
  @Get()
  findOne(@Query('id') id: string, @CurrentUser() user: JwtPayload) {
    /**
     * Kiểm tra quyền truy cập với role và id
     * @param user Thông tin user hiện tại (jwt payload)
     * @param targetId Id của đối tượng đang thao tác
     * @param allowedRoles Các role được phép thao tác không cần so sánh id
     * @param checkOwnUser Nếu true, user chỉ được thao tác với chính mình nếu không thuộc allowedRoles
     */
    checkPermissionForUser(user, id, [Role.ADMIN, Role.LEADER], true);

    return this.usersService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.LEADER)
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
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: MulterFile,
  ) {
    checkPermissionForUser(user, id, [Role.ADMIN, Role.LEADER], true);

    return this.usersService.update(id, updateUserDto, file);
  }

  @Delete('delete')
  remove(@Query('id') id: string, @CurrentUser() user: JwtPayload) {
    checkPermissionForUser(user, id, [Role.ADMIN, Role.LEADER], true);

    return this.usersService.remove(id);
  }
}
