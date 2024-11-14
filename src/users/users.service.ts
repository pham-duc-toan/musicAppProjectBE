import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, ObjectId, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly roleService: RolesService,
  ) {}
  checkRoleExist = async (id: string) => {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }
    const result = await this.roleService.checkRoleExist(id);
    return result;
  };
  getHashPassWord = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  };
  async create(createUserDto: CreateUserDto): Promise<User> {
    createUserDto.password = this.getHashPassWord(createUserDto.password);
    const existUserId = await this.userModel.findOne({
      userId: createUserDto.userId,
    });
    const existUser = await this.userModel.findOne({
      username: createUserDto.username,
      type: createUserDto.type,
    });
    const result = await this.checkRoleExist(createUserDto.role);
    if (!result) {
      throw new BadRequestException(`Role ${createUserDto.role} is not valid`);
    }

    if (!existUser && !existUserId) {
      const createdUser = new this.userModel(createUserDto);
      return createdUser.save();
    }
    throw new BadRequestException(`Đã tồn tại tài khoản!`);
  }

  async findAll(options: any): Promise<User[]> {
    const { filter, sort, skip, limit, projection, population } = options;
    return this.userModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(population)
      .exec();
  }
  async addPlaylistToUser(userId: string, playlistId: string): Promise<User> {
    // Tìm user theo userId
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    // Thêm playlistId vào listPlaylist
    user.listPlaylist.push(new Types.ObjectId(playlistId));
    await user.save(); // Lưu user với listPlaylist đã được cập nhật

    return user;
  }
  async findUserId(userId: string) {
    const user = await this.userModel
      .findOne({ _id: userId })
      .populate({
        path: 'listPlaylist',
        model: 'PlayList',
        populate: {
          path: 'listSong',
          model: 'Song',
          populate: {
            path: 'singerId',
            model: 'Singer',
          },
        },
      })
      .exec();

    return user;
  }
  async profileUser(userId: string) {
    const user = await this.userModel
      .findOne({ _id: userId })
      .select('-password')
      .populate({
        path: 'role',
        model: 'Role',
        populate: {
          path: 'permissions',
          model: 'Permission',
        },
      })

      .populate({
        path: 'listPlaylist',
        model: 'PlayList',
        populate: {
          path: 'listSong',
          model: 'Song',
          populate: [
            {
              path: 'singerId',
              model: 'Singer',
            },
            {
              path: 'topicId',
              model: 'Topic',
            },
          ],
        },
      })
      // .populate({
      //   path: 'listFavoriteSong',
      //   model: 'Song',
      //   populate: [
      //     {
      //       path: 'singerId',
      //       model: 'Singer',
      //     },
      //     {
      //       path: 'topicId',
      //       model: 'Topic',
      //     },
      //   ],
      // })
      .populate({
        path: 'singerId',
        model: 'Singer',
      })
      .exec();

    return user;
  }
  async checkUserLogin(username: string, pass: string) {
    const user = await this.userModel
      .findOne({ username: username })
      .populate('role')
      .lean()
      .exec();

    if (user && compareSync(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    throw new BadRequestException('Sai tài khoản hoặc mật khẩu');
  }
  async deleteAll(): Promise<void> {
    await this.userModel.deleteMany({}).exec();
  }
  updateTokenRefresh = async (refresh_token: string, id: string) => {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }
    return await this.userModel.updateOne(
      { _id: id },
      {
        refreshToken: refresh_token,
      },
    );
  };
  findByTokenRefresh = async (refresh_token: string) => {
    return await this.userModel
      .findOne({
        refreshToken: refresh_token,
      })
      .populate('role');
  };
  //xóa playlist
  async removePlaylistFromUser(userId: Types.ObjectId, playlistId: string) {
    // Chuyển đổi playlistId từ string sang ObjectId
    const playlistObjectId = new Types.ObjectId(playlistId);

    // Tìm user và cập nhật bằng cách xóa playlistId khỏi listPlaylist
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { listPlaylist: playlistObjectId } },
      { new: true },
    );

    // Nếu user không tồn tại, ném lỗi
    if (!updatedUser) {
      throw new NotFoundException('User không tồn tại');
    }

    return { message: 'Xóa playlist thành công', user: updatedUser };
  }
  async updateSinger(userId: Types.ObjectId, singerId: string) {
    // Chuyển đổi singerId từ string sang ObjectId
    const singerObjectId = new Types.ObjectId(singerId);

    // Kiểm tra người dùng có tồn tại không
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    // Kiểm tra xem user đã có trường singerId chưa
    if (user.singerId) {
      throw new BadRequestException('User đã được đăng ký singer');
    }

    // Kiểm tra xem singerId đã được quản lý bởi user khác chưa
    const singerManaged = await this.userModel.findOne({
      singerId: singerObjectId,
    });
    if (singerManaged) {
      throw new BadRequestException('Singer đã được quản lý');
    }

    // Nếu các điều kiện thỏa mãn, cập nhật singerId cho user
    user.singerId = singerObjectId;
    await user.save();

    return { message: 'Cập nhật singerId thành công', user };
  }
  //----FAVORITE SONGS--------
  async getFavoriteSongs(userId: Types.ObjectId) {
    // Tìm user theo userId và populate listFavoriteSong để lấy chi tiết các bài hát
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'listFavoriteSong',
        model: 'Song', // Model 'Song' cần khớp với tên model của bài hát
      })
      .exec();

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    return user.listFavoriteSong; // Trả về danh sách yêu thích
  }

  async addSongFavorite(userId: Types.ObjectId, songId: string): Promise<User> {
    // Tìm user theo userId
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    // Kiểm tra xem songId đã tồn tại trong listFavoriteSong chưa
    const songObjectId = new Types.ObjectId(songId);
    if (user.listFavoriteSong.includes(songObjectId)) {
      throw new BadRequestException('Bài hát đã có trong danh sách yêu thích');
    }

    // Thêm songId vào listFavoriteSong
    user.listFavoriteSong.push(songObjectId);
    await user.save(); // Lưu user với listFavoriteSong đã được cập nhật

    return user;
  }
  async removeSongFavorite(
    userId: Types.ObjectId,
    songId: string,
  ): Promise<User> {
    // Tìm user theo userId
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    // Chuyển đổi songId từ string sang ObjectId
    const songObjectId = new Types.ObjectId(songId);

    // Kiểm tra xem songId có tồn tại trong listFavoriteSong không
    const songIndex = user.listFavoriteSong.indexOf(songObjectId);
    if (songIndex === -1) {
      throw new BadRequestException(
        'Bài hát không có trong danh sách yêu thích',
      );
    }

    // Xóa songId khỏi listFavoriteSong
    user.listFavoriteSong.splice(songIndex, 1);
    await user.save(); // Lưu user với listFavoriteSong đã được cập nhật

    return user;
  }
}