import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  Get,
  Query,
  Delete,
} from '@nestjs/common';
import { FileService } from './file.service';
import { CreateFileDto } from './dto/create-file.dto';
import { PaginationDto } from './dto/pagination-file.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MulterFile } from '@/types/multer-file';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('create')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  create(
    @Body() createFileDto: CreateFileDto,
    @UploadedFiles() files: MulterFile[],
  ) {
    return this.fileService.create(createFileDto, files);
  }

  @Get('pagination')
  async findByProject(@Query() paginationDto: PaginationDto) {
    return this.fileService.findByProject(paginationDto);
  }

  @Delete()
  async deleteFile(@Query('id') id: string) {
    return this.fileService.deleteById(id);
  }

  @Delete('project')
  async deleteByProject(@Query('projectId') projectId: string) {
    return this.fileService.deleteFilesByProjectId(projectId);
  }
}
