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

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

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

  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationProjectDto) {
    return this.projectsService.Pagination(paginationDto);
  }

  @Get()
  findOne(@Query('id') id: string) {
    return this.projectsService.findProjectById(id);
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
    @Body() updateProjectDto: UpdateProjectDto,
    @UploadedFile() file?: MulterFile,
  ) {
    return this.projectsService.updateProject(id, updateProjectDto, file);
  }

  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.projectsService.removeProjectDev(id);
  }
}
