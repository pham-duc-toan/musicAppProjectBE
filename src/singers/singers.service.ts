// src/singers/singers.service.ts

import {
  BadRequestException,
  ConflictException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Singer, SingerDocument } from './singers.schema';
import { UpdateSingerDto } from './dto/update-singer.dto';
import { convertToSlug } from 'src/helpers/convertToSlug';
import { UserService } from 'src/users/users.service';
import { SongsService } from 'src/songs/songs.service';

@Injectable()
export class SingersService {
  constructor(
    @InjectModel(Singer.name) private singerModel: Model<SingerDocument>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => SongsService))
    private readonly songService: SongsService,
  ) {}
  async existId(id: string) {
    if (!isValidObjectId(id)) {
      return false; // Hoặc bạn có thể ném ra một lỗi tùy vào yêu cầu
    }
    const exist = await this.singerModel.findOne({ _id: id });
    if (exist) {
      return true;
    }
    return false;
  }

  async createSinger(data: Partial<Singer>) {
    const newSinger = new this.singerModel(data);
    return newSinger.save();
  }
  async patchSinger(id: string, updateSingerDto: UpdateSingerDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }

    const updateSinger = await this.singerModel.updateOne(
      { _id: id },
      updateSingerDto,
    );
    if (!updateSinger) {
      throw new BadRequestException('Lỗi update singer service');
    }
    return updateSinger;
  }

  async findAll(options: any) {
    const { filter, sort, skip, limit, projection, population } = options;
    console.log(filter);

    if (filter.fullName && typeof filter.fullName !== 'string') {
      filter.fullName = '';
    }
    if (filter.slug && typeof filter.slug !== 'string') {
      filter.slug = '';
    }
    return this.singerModel
      .find({
        $or: [
          { fullName: new RegExp(filter.query, 'i') },
          { slug: new RegExp(convertToSlug(filter.query), 'i') },
          { filter },
        ],
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(population)
      .exec();
  }
  async findClient(options: any) {
    const { filter, sort, skip, limit, projection, population } = options;
    console.log(filter);

    if (filter.fullName && typeof filter.fullName !== 'string') {
      filter.fullName = '';
    }
    if (filter.slug && typeof filter.slug !== 'string') {
      filter.slug = '';
    }
    return this.singerModel
      .find({ status: 'active', deleted: false })
      .find({
        $or: [
          { fullName: new RegExp(filter.query, 'i') },
          { slug: new RegExp(convertToSlug(filter.query), 'i') },
          { filter },
        ],
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(population)
      .exec();
  }
  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }
    const singer = await this.singerModel.findById(id).exec();
    return singer;
  }
  async findOneClient(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }
    const singer = await this.singerModel
      .findOne({ _id: id, status: 'active', deleted: false })
      .exec();
    if (!singer) {
      throw new BadRequestException('Không tồn tại singer này!');
    }
    return singer;
  }
  //-------ADMIN QUAN LY-------
  async deleteSinger(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }

    const singer = await this.singerModel.deleteOne({ _id: id });
    await this.userService.deleteSinger(id);
    return singer;
  }

  async changeStatus(singerId: string) {
    const singer = await this.singerModel.findById(singerId);
    if (!singer) {
      throw new NotFoundException('Ca sĩ không tồn tại');
    }
    if (singer.status == 'active') {
      singer.status = 'inactive';
      await this.songService.banSongByBanSinger(singerId);
    } else {
      singer.status = 'active';
    }

    await singer.save();

    return singer;
  }
}
