import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Song, SongDocument } from './songs.shema';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SingersService } from 'src/singers/singers.service';
import { TopicsService } from 'src/topics/topics.service';
import { UserService } from 'src/users/users.service';
import { convertToSlug } from 'src/helpers/convertToSlug';

@Injectable()
export class SongsService {
  constructor(
    @InjectModel(Song.name) private songModel: Model<SongDocument>,
    private readonly singerService: SingersService,
    private readonly topicService: TopicsService,
    private readonly usersService: UserService,
  ) {}

  async create(createSongDto: CreateSongDto, singerId: string) {
    if (!singerId) {
      throw new UnauthorizedException('Chỉ ca sĩ mới có thể thực hiện');
    }
    const existIdSinger = await this.singerService.existId(singerId);
    const existIdTopic = await this.topicService.existId(
      createSongDto.topicId.toString(),
    );

    if (!existIdSinger || !existIdTopic) {
      throw new BadRequestException('Sai singerId hoặc topicId!');
    }

    const dataNewSong: any = createSongDto;
    dataNewSong.singerId = singerId;
    const newSong = new this.songModel(dataNewSong);

    return newSong.save();
  }

  async findAll(options: any): Promise<{ data: Song[]; total: number }> {
    const { filter, sort, skip, limit, projection, population } = options;
    const sortOption = sort || { createdAt: -1 };
    const populateOption = population || ['singerId', 'topicId'];
    const data = await this.songModel
      .find({ status: 'active', deleted: 'false' })
      .find({
        $or: [
          { title: new RegExp(filter.query, 'i') },
          { lyrics: new RegExp(filter.query, 'i') },
          { slug: new RegExp(convertToSlug(filter.query), 'i') },
          { filter },
        ],
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate(populateOption)
      .exec();

    if (!data) {
      throw new BadRequestException('Lỗi tìm kiếm song service');
    }

    return { data, total: data.length };
  }

  async findOfSinger(singerId: string) {
    return this.songModel
      .find({ deleted: false, status: 'active' })
      .find({ singerId: singerId })
      .populate('singerId')
      .populate('topicId')
      .sort({ createdAt: -1 })
      .exec();
  }
  async findOfTopic(topicId: string) {
    return this.songModel
      .find({ deleted: false, status: 'active' })
      .find({ topicId: topicId })
      .populate('singerId')
      .populate('topicId')
      .sort({ createdAt: -1 })
      .exec();
  }
  async findFull(): Promise<Song[]> {
    return this.songModel
      .find({ deleted: false })
      .populate('singerId')
      .populate('topicId')
      .sort({ createdAt: -1 })
      .exec();
  }
  async findOne(id: string): Promise<Song> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }
    const song = await this.songModel
      .findById(id)
      .populate('singerId')
      .populate('topicId')
      .exec();

    return song;
  }

  async update(id: string, updateSongDto: UpdateSongDto, singerId: string) {
    if (!singerId) {
      throw new UnauthorizedException(
        'Không có singerId, yêu cầu đăng nhập lại',
      );
    }
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }
    if (singerId) {
      const existIdSinger = await this.singerService.existId(
        singerId.toString(),
      );
      if (!existIdSinger) {
        throw new BadRequestException('Sai singerId!');
      }
    }
    if (updateSongDto.topicId) {
      const existIdTopic = await this.topicService.existId(
        updateSongDto.topicId.toString(),
      );
      if (!existIdTopic) {
        throw new BadRequestException('Sai topicId!');
      }
    }

    const updatedSong = await this.songModel
      .updateOne({ _id: id, singerId: singerId }, updateSongDto, { new: true })
      .exec();
    if (!updatedSong) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }
    return updatedSong;
  }

  async remove(id: string, singerId: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }

    const deletedSong = await this.songModel.deleteOne({
      _id: id,
      singerId: singerId,
    });

    if (!deletedSong) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }
    return deletedSong;
  }
  async findSongBySinger(singerId: string) {
    return this.songModel
      .find({ singerId: singerId })
      .populate('topicId')
      .exec();
  }
  //--------FAVORITE SONG----------
  async getFavoriteSongs(userId: Types.ObjectId) {
    return this.usersService.getFavoriteSongs(userId);
  }

  // Thêm bài hát vào danh sách yêu thích
  async addSongFavorite(userId: Types.ObjectId, songId: string) {
    // Kiểm tra bài hát có tồn tại không
    const song = await this.songModel.findById(songId);
    if (!song) {
      throw new NotFoundException('Bài hát không tồn tại');
    }

    const updatedUser = await this.usersService.addSongFavorite(userId, songId);

    if (updatedUser) {
      song.like += 1;
      await song.save();
    }
    return updatedUser;
  }

  // Xóa bài hát khỏi danh sách yêu thích
  async removeSongFavorite(userId: Types.ObjectId, songId: string) {
    const song = await this.songModel.findById(songId);
    if (!song) {
      throw new NotFoundException('Bài hát không tồn tại');
    }

    const updatedUser = await this.usersService.removeSongFavorite(
      userId,
      songId,
    );
    if (updatedUser) {
      song.like -= 1;
      await song.save();
    }
    return updatedUser;
  }
  //-------SO LUOT NGHE-----
  async increaseListen(songId: string) {
    const song = await this.songModel.findById(songId);
    if (!song) {
      throw new NotFoundException('Bài hát không tồn tại');
    }

    song.listen += 1;
    await song.save();

    return song;
  }
  //-------ADMIN QUAN LY-------
  async changeStatus(songId: string) {
    const song = await this.songModel.findById(songId);
    if (!song) {
      throw new NotFoundException('Bài hát không tồn tại');
    }
    if (song.status == 'active') {
      song.status = 'inactive';
    } else {
      song.status = 'active';
    }

    await song.save();

    return song;
  }
}
