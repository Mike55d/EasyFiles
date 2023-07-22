import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FilesDocument = HydratedDocument<Files>;

@Schema()
export class Files {
  @Prop()
  name: string;

  @Prop()
  extension: string;

  @Prop()
  type: string;
}

export const FilesSchema = SchemaFactory.createForClass(Files);
