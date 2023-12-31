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
  UseGuards,
  Query,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CreateFileDto } from './dto/create-file.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SearchDto } from './dto/search.dto';
import { UploadImageDto } from './dto/upload-image.dto';
@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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

  @Get('searchImages/search')
  async search(@Query() q: SearchDto) {
    return await this.filesService.search(q);
  }

  @Post('UploadImage/upload')
  async uploadImage(@Body() uploadImageDto: UploadImageDto) {
    return this.filesService.uploadImage(uploadImageDto);
  }
}
