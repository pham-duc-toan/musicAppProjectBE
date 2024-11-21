// src/singers/singers.module.ts

import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Singer, SingerSchema } from './singers.schema';
import { SingersService } from './singers.service';
import { SingersController } from './singers.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { UserModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Singer.name, schema: SingerSchema }]),
    CloudinaryModule,
    forwardRef(() => UserModule),
  ],
  controllers: [SingersController],
  providers: [SingersService],
  exports: [SingersService],
})
export class SingersModule {}
