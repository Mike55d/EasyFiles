import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CreateFileDto } from './dto/create-file.dto';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'List of cats',
    type: CreateFileDto,
  })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createFile: CreateFileDto,
  ) {
    return await this.filesService.create(file, createFile);
  }

  @Get()
  async findAll() {
    return await this.filesService.findAll();
  }

  @Get(':id')
  async getFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const file = await this.filesService.getFile(id, res);
      return new StreamableFile(file);
    } catch (error) {
      return 'file not found';
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return await this.filesService.update(id, updateFileDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.filesService.remove(id);
  }
}
