import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { Types } from 'mongoose';
import { SongForYouService } from './song-for-you.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';

@Controller('song-for-you')
export class SongForYouController {
  constructor(private readonly songForYouService: SongForYouService) {}

  // API để lấy danh sách bài hát đề xuất
  @Get()
  async getRecommendedSongs() {
    return this.songForYouService.getRecommendedSongs();
  }
  @Get('songId')
  async getSongs() {
    return this.songForYouService.getSongs();
  }
  @UseGuards(JwtAuthGuard)
  @Post('add/:songId')
  async addSongToList(@Param('songId') songId: string) {
    return this.songForYouService.addSongToList(new Types.ObjectId(songId));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('remove/:songId')
  async removeSongFromList(@Param('songId') songId: string) {
    return this.songForYouService.removeSongFromList(
      new Types.ObjectId(songId),
    );
  }
  @UseGuards(JwtAuthGuard)
  @Patch('update-order')
  async updateSongList(@Body() body: { listSong: string[] }) {
    const { listSong } = body;

    // Kiểm tra nếu listSong không phải là mảng
    if (!Array.isArray(listSong)) {
      throw new Error('Invalid input: listSong must be an array of song IDs');
    }

    // Gọi service để cập nhật
    return this.songForYouService.updateSongs(listSong);
  }
}