import { IsString, IsOptional } from 'class-validator';

export class CreateFileDto {
  @IsString()
  @IsOptional()
  name?: string;
}
