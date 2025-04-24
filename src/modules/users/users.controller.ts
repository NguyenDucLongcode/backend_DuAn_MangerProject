import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, PaginationDto, UpdateUserDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
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
  update(@Query('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.usersService.remove(id);
  }
}
