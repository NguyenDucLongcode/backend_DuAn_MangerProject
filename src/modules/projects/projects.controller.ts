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
import { ProjectsService } from './projects.service';

// DTO
import {
  CreateProjectDto,
  UpdateProjectDto,
  PaginationProjectDto,
} from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileAvatarFilter } from '@/cloudinary/filter/filter.user.avatar';
import { MulterFile } from '@/types/multer-file';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/enums/role.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/types/jwt-payload.interface';
import { checkPermission } from '@/common/utils/role/auth-utils';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Roles(Role.ADMIN, Role.LEADER)
  @Post('create')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1 },
      fileFilter: imageFileAvatarFilter,
    }),
  )
  create(
    @Body() createProjectDto: CreateProjectDto,
    @UploadedFile() file?: MulterFile,
  ) {
    return this.projectsService.createProjet(createProjectDto, file);
  }

  @Roles(Role.ADMIN, Role.LEADER)
  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationProjectDto) {
    return this.projectsService.Pagination(paginationDto);
  }

  @Get()
  async findOne(@Query('id') id: string, @CurrentUser() user: JwtPayload) {
    /**
     * Kiểm tra quyền truy cập với role và id
     * @param user Thông tin user hiện tại (jwt payload)
     * @param allowedRoles Các role được phép thao tác không cần so sánh id
     * @param checkOwnUser Nếu true, user chỉ được thao tác với chính mình nếu không thuộc allowedRoles
     */
    const isProject = await this.projectsService.verifyUserAccessToProjectId(
      id,
      user.id,
    );
    checkPermission(user, isProject, [Role.ADMIN]);

    return this.projectsService.findProjectById(id);
  }

  @Patch('update')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1 },
      fileFilter: imageFileAvatarFilter,
    }),
  )
  async update(
    @Query('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: MulterFile,
  ) {
    // Kiểm tra quyền truy cập với role và id
    const hasAccess = await this.projectsService.verifyUserAccessToProjectId(
      id,
      user.id,
    );
    checkPermission(user, hasAccess, [Role.ADMIN]);

    return this.projectsService.updateProject(id, updateProjectDto, file);
  }

  @Delete('delete')
  async remove(@Query('id') id: string, @CurrentUser() user: JwtPayload) {
    // Kiểm tra quyền truy cập với role và id
    const hasAccess = await this.projectsService.verifyUserAccessToProjectId(
      id,
      user.id,
    );
    checkPermission(user, hasAccess, [Role.ADMIN]);
    return this.projectsService.removeProjectDev(id);
  }
}
