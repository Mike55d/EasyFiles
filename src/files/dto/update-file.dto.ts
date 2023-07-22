import { PartialType } from '@nestjs/mapped-types';
import { CreateFileDto } from './create-file.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFileDto extends PartialType(CreateFileDto) {
  @ApiProperty({ type: 'string', required: true })
  name: string;
}
