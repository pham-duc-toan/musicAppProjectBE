// src/singers/singers.controller.ts

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  ParseFilePipeBuilder,
  Patch,
  Query,
} from '@nestjs/common';
import { SingersService } from './singers.service';
import { Singer } from './singers.schema';
import { ResponeMessage, User } from 'src/decorator/customize';
import { isValidObjectId } from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryFileUploadInterceptor } from 'src/interceptors/FileToLinkOnlineCloudinary.interceptor';
import { UpdateSingerDto } from './dto/update-singer.dto';
import {
  ValidatorFileExistImage,
  ValidatorFileTypeImage,
} from 'src/interceptors/ValidatorFileExist.interceptor';
import { CreateSingerDto } from './dto/create-singer.dto';
import aqp from 'api-query-params';
import { UserService } from 'src/users/users.service';

@Controller('singers')
export class SingersController {
  constructor(
    private readonly singersService: SingersService,
    private usersService: UserService,
  ) {}

  @Post('create')
  @UseInterceptors(
    FileInterceptor('avatar'),
    ValidatorFileExistImage,
    CloudinaryFileUploadInterceptor,
  )
  async createSinger(@Body() createSingerDto: CreateSingerDto) {
    return this.singersService.createSinger(createSingerDto);
  }
  @Get()
  @ResponeMessage('Find all')
  async findAll(@Query() query: any): Promise<Singer[]> {
    const { sort, skip, limit, projection, population, ...e } = aqp(query);

    const filter = e.filter;
    return this.singersService.findAll({
      filter,
      sort,
      skip,
      limit,
      projection,
      population,
    });
  }
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('avatar'),
    ValidatorFileTypeImage,
    CloudinaryFileUploadInterceptor,
  )
  async patchSinger(
    @Param('id') id: string,

    @Body() updateSingerDto: UpdateSingerDto,
  ) {
    return this.singersService.patchSinger(id, updateSingerDto);
  }
  @Get('detail/:id')
  async findOne(@Param('id') id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }
    return this.singersService.findOne(id);
  }

  @Delete(':id')
  async deleteSinger(@Param('id') id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }
    return this.singersService.deleteSinger(id);
  }
}
