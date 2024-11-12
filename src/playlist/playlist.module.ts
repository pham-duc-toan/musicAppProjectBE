import { Module } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { PlaylistController } from './playlist.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PlayList, PlayListSchema } from './playlist.schema';
import { SongsModule } from 'src/songs/songs.module';
import { UserModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlayList.name, schema: PlayListSchema },
    ]),
    SongsModule,
    UserModule,
  ],
  controllers: [PlaylistController],
  providers: [PlaylistService],
})
export class PlaylistModule {}
