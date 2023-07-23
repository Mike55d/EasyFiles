import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class SearchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  page: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  per_page: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  order_by: string;

  // @ApiProperty({ type: 'string', format: 'binary', required: true })
  // file: Express.Multer.File;
}
