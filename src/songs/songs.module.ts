import { Module } from '@nestjs/common';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Song, SongSchema } from './songs.shema';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { SingersModule } from 'src/singers/singers.module';
import { TopicsModule } from 'src/topics/topics.module';
import { UserModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Song.name, schema: SongSchema }]),
    CloudinaryModule,
    SingersModule,
    TopicsModule,
    UserModule,
  ],
  controllers: [SongsController],
  providers: [SongsService],
  exports: [SongsService],
})
export class SongsModule {}