import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.schema';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import aqp from 'api-query-params';
import { UpdateSinger } from './dto/update-singer.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findAll(@Query() query: any): Promise<User[]> {
    const { sort, skip, limit, projection, population, ...e } = aqp(query);
    const filter = e.filter;
    return this.userService.findAll({
      filter,
      sort,
      skip,
      limit,
      projection,
      population,
    });
  }
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req): Promise<User> {
    return this.userService.profileUser(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('updateSinger')
  async updateSinger(@Request() req, @Body() singerId: UpdateSinger) {
    return this.userService.updateSinger(req.user._id, singerId.id);
  }

  @Delete()
  async deleteAll(): Promise<Object> {
    this.userService.deleteAll();
    return {
      message: 'all user is deleted !',
    };
  }
}
