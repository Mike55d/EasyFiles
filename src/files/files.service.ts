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
import { UploadImageDto } from './dto/upload-image.dto';
import { catchError, firstValueFrom } from 'rxjs';
import { SearchDto } from './dto/search.dto';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { createWriteStream } from 'fs';
import { uid } from 'uid';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(Files.name) private filesModel: Model<FilesDocument>,
    private readonly httpService: HttpService,
  ) {}

  async create(file: Express.Multer.File, createFile: CreateFileDto) {
    try {
      const type = mime.lookup(file.originalname);
      const extension = file.originalname.split('.')[1];

      const createdFile = new this.filesModel({
        name: createFile.name
          ? createFile.name
          : file.originalname.split('.')[0],
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
    } catch (error) {
      return 'invalid file';
    }
  }

  async findAll() {
    const allFiles = await this.filesModel.find();
    const filesWithUrl = allFiles.map((file) => ({
      ...file.toObject(),
      url: `${process.env.SERVER_URL}/files/${file._id.toString()}`,
    }));
    return filesWithUrl;
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
    try {
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
    } catch (error) {
      console.log(error);
    }
    return 'file removed';
  }

  async search(q: SearchDto) {
    const apiUrl = 'https://api.unsplash.com/search/photos';
    const { data } = await firstValueFrom(
      this.httpService
        .get(apiUrl, {
          headers: {
            Authorization:
              'Client-ID Q1CN8auOdwNVxUhOtlo66VHp4ymHndHjq3wSz4DT_1g',
          },
          params: q,
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw error;
          }),
        ),
    );
    return data;
  }

  async uploadImage(uploadImageDto: UploadImageDto) {
    const publicDir = path.join('./temp-files');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const fileUrl = uploadImageDto.imageUrl;
    try {
      await this.httpService
        .axiosRef({
          method: 'get',
          url: fileUrl,
          responseType: 'stream',
        })
        .then((response) => {
          const ext = response.headers['content-type'].split('/')[1];
          const type = response.headers['content-type'];
          const outputLocationPath = `./temp-files/${uid()}.${ext}`;
          const writer = createWriteStream(outputLocationPath);
          return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error = null;
            writer.on('error', (err) => {
              error = err;
              writer.close();
              reject(err);
            });
            writer.on('close', async () => {
              if (!error) {
                const file = await fsPromises.readFile(outputLocationPath);
                const createdFile = new this.filesModel({
                  name: uploadImageDto.name ? uploadImageDto.name : uid(),
                  type,
                  extension: ext,
                });
                const savedFile = await createdFile.save();
                const input = {
                  Bucket: process.env.AWS_BUCKET,
                  Body: file,
                  Key: savedFile._id.toString(),
                };
                const command = new PutObjectCommand(input);
                await client.send(command);
                fs.unlinkSync(outputLocationPath);
                resolve(true);
              }
            });
          });
        });
    } catch (error) {
      return 'invalid url ';
    }
    return 'file uploaded';
  }
}
