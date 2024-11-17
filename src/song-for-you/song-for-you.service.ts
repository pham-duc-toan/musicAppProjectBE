import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Types } from 'mongoose';
import { SongForYou } from './songForYou.shema';

@Injectable()
export class SongForYouService {
  constructor(
    @InjectModel(SongForYou.name) private songForYouModel: Model<SongForYou>,
  ) {}

  // Lấy danh sách bài hát đề xuất
  async getRecommendedSongs(): Promise<SongForYou[]> {
    return this.songForYouModel.find().populate('listSong').exec();
  }

  // Thêm bài hát vào danh sách đề xuất
  async addSongToList(songId: Types.ObjectId): Promise<SongForYou> {
    const songForYou = await this.songForYouModel.findOneAndUpdate(
      {},
      { $push: { listSong: songId } },
      { new: true, upsert: true },
    );
    return songForYou;
  }

  // Xóa bài hát khỏi danh sách
  async removeSongFromList(songId: Types.ObjectId): Promise<SongForYou> {
    return this.songForYouModel.findOneAndUpdate(
      {},
      { $pull: { listSong: songId } },
      { new: true },
    );
  }
  async updateSongs(listSong: string[]) {
    return this.songForYouModel.updateOne({}, { listSong: listSong });
  }
}
