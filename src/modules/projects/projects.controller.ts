import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationProjectDto } from './dto/pagination-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('create')
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.createProjet(createProjectDto);
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
  update(@Query('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.updateProject(id, updateProjectDto);
  }

  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.projectsService.removeProjectDev(id);
  }
}
