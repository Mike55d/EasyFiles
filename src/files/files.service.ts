import { Injectable } from '@nestjs/common';
import { UpdateFileDto } from './dto/update-file.dto';
import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { client } from 'src/aws-client-config';
import * as mime from 'mime-types';
import { CreateFileDto } from './dto/create-file.dto';
import { Files, FilesDocument } from './schema/files.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(Files.name) private filesModel: Model<FilesDocument>,
  ) {}

  async create(file: Express.Multer.File, createFile: CreateFileDto) {
    const type = mime.lookup(file.originalname);
    const extension = file.originalname.split('.')[1];

    const createdFile = new this.filesModel({
      name: createFile.name ? createFile.name : file.originalname.split('.')[0],
      type,
      extension,
    });
    const savedFile = await createdFile.save();
    const input = {
      Bucket: process.env.AWS_BUCKET,
      Body: file.buffer,
      Key: savedFile._id.toString(),
    };
    const command = new PutObjectCommand(input);
    const response = await client.send(command);
    return response;
  }

  async findAll() {
    return await this.filesModel.find();
  }

  async getFile(id: string, res: Response) {
    const fileData = await this.filesModel.findOne({ _id: id });
    res.set({
      'Content-Type': fileData.type,
      'Content-Disposition': `attachment; filename="${fileData.name}.${fileData.extension}"`,
    });
    const input = {
      Bucket: process.env.AWS_BUCKET,
      Key: id,
    };
    const command = new GetObjectCommand(input);
    const response = await client.send(command);
    const file = await response.Body.transformToByteArray();
    return file;
  }

  async update(id: string, updateFileDto: UpdateFileDto) {
    if (updateFileDto.name) {
      await this.filesModel.updateOne(
        { _id: id },
        { name: updateFileDto.name },
      );
    }
    return `This action updates a #${id} file`;
  }

  async remove(id: string) {
    const file = await this.filesModel.findOne({ _id: id });
    if (file) {
      file.deleteOne();
    }
    const input = {
      Bucket: process.env.AWS_BUCKET,
      Key: id,
    };
    const command = new DeleteObjectCommand(input);
    await client.send(command);
    return 'file removed';
  }
}
