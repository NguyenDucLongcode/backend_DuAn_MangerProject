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
import { checkPermission } from '@/common/utils/role/auth-utils';
import { ChangeRoleUserDto } from './dto/changeRole-user.dto';
import { Public } from '@/common/decorators/public.decorator';

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

  @Roles(Role.ADMIN)
  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationDto) {
    return this.usersService.Pagination(paginationDto);
  }

  @Get()
  async findOne(@Query('id') id: string, @CurrentUser() user: JwtPayload) {
    /**
     * Kiểm tra quyền truy cập với role và id
     * @param user Thông tin user hiện tại (jwt payload)
     * @param allowedRoles Các role được phép thao tác không cần so sánh id
     * @param checkOwnUser Nếu true, user chỉ được thao tác với chính mình nếu không thuộc allowedRoles
     */
    const isUser = await this.usersService.findById(id);
    checkPermission(user, isUser, [Role.ADMIN, Role.LEADER]);

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
  async update(
    @Query('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: MulterFile,
  ) {
    // Kiểm tra quyền truy cập cho một user
    const isOwnerOrMember = await this.usersService.findById(id);
    checkPermission(user, isOwnerOrMember, [Role.ADMIN]);
    return this.usersService.update(id, updateUserDto, file);
  }

  @Roles(Role.ADMIN)
  @Patch('change-role')
  changeUserRole(@Query('id') id: string, @Body() dto: ChangeRoleUserDto) {
    return this.usersService.changeUserRole(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.usersService.remove(id);
  }
}
