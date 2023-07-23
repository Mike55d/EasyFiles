import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Files, FilesSchema } from './schema/files.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Files.name, schema: FilesSchema }]),
    HttpModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
