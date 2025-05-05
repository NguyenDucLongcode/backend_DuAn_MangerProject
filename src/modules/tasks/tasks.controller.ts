import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';

// dto
import { CreateTaskDto, UpdateTaskDto, PaginationTaskDto } from './dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('create')
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.createTask(createTaskDto);
  }

  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationTaskDto) {
    return this.tasksService.Pagination(paginationDto);
  }

  @Get()
  findOne(@Query('id') id: string) {
    return this.tasksService.findTaskById(id);
  }

  @Patch('update')
  update(@Query('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.updateTask(id, updateTaskDto);
  }

  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.tasksService.removeTask(id);
  }
}
