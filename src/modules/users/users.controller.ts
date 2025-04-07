import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, PaginationDto, UpdateUserDto } from './dto';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  create(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    return this.usersService.create(createUserDto, req);
  }

  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationDto, @Req() req: Request) {
    return this.usersService.Pagination(paginationDto, req);
  }

  @Get()
  findOne(@Query('id') id: string, @Req() req: Request) {
    return this.usersService.findOne(+id, req);
  }

  @Patch('update')
  update(
    @Query('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    return this.usersService.update(+id, updateUserDto, req);
  }

  @Delete('delete')
  remove(@Query('id') id: string, @Req() req: Request) {
    return this.usersService.remove(+id, req);
  }
}
