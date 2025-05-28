import { Controller, Get, Post, Body, Delete, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';

// dto
import { CreateTaskDto, UpdateTaskDto, PaginationTaskDto } from './dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/enums/role.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/types/jwt-payload.interface';
import { checkPermission } from '@/common/utils/role/auth-utils';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Roles(Role.ADMIN, Role.LEADER)
  @Post('create')
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.createTask(createTaskDto);
  }

  @Roles(Role.ADMIN, Role.LEADER)
  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationTaskDto) {
    return this.tasksService.Pagination(paginationDto);
  }

  @Get()
  async findOne(@Query('id') id: string, @CurrentUser() user: JwtPayload) {
    /**
     * Kiểm tra quyền truy cập cho một user
     * @param user Thông tin người dùng hiện tại
     * @param isOwnerOrMember User có đang thao tác với dữ liệu của chính mình/nhóm mình không?
     * @param allowedRoles Các role có toàn quyền
     */
    const isTask = await this.tasksService.isTaskAssignedToUser(id, user.id);
    checkPermission(user, isTask, [Role.ADMIN, Role.LEADER]);
    return this.tasksService.findTaskById(id);
  }

  async update(
    @Query('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Kiểm tra quyền truy cập cho một user
    const isTask = await this.tasksService.isTaskAssignedToUser(id, user.id);
    checkPermission(user, isTask, [Role.ADMIN, Role.LEADER]);
    return this.tasksService.updateTask(id, updateTaskDto);
  }

  @Roles(Role.ADMIN, Role.LEADER)
  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.tasksService.removeTask(id);
  }
}
