import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  BadRequestException,
  Patch,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { Topic } from './topics.schema';
import { CreateTopicDto } from './dto/create-topic.dto';
import { isValidObjectId } from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ValidatorFileExistImage,
  ValidatorFileTypeImage,
} from 'src/interceptors/ValidatorFileExist.interceptor';
import { CloudinaryFileUploadInterceptor } from 'src/interceptors/FileToLinkOnlineCloudinary.interceptor';
import aqp from 'api-query-params';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post('create')
  @UseInterceptors(
    FileInterceptor('avatar'),
    ValidatorFileExistImage,
    CloudinaryFileUploadInterceptor,
  )
  async create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicsService.create(createTopicDto);
  }

  @Get()
  async findAll(@Query() query: any): Promise<Topic[]> {
    const { sort, skip, limit, projection, population, ...e } = aqp(query);

    const filter = e.filter;

    return this.topicsService.findAll({
      filter,
      sort,
      skip,
      limit,
      projection,
      population,
    });
  }

  @Get('client')
  async findClient(@Query() query: any): Promise<Topic[]> {
    const { sort, skip, limit, projection, population, ...e } = aqp(query);

    const filter = e.filter;

    return this.topicsService.findClient({
      filter,
      sort,
      skip,
      limit,
      projection,
      population,
    });
  }
  @Get('detail/:id')
  async findOne(@Param('id') id: string): Promise<Topic> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }
    return this.topicsService.findOne(id);
  }

  @Patch('editTopic/:id')
  @UseInterceptors(
    FileInterceptor('avatar'),
    ValidatorFileTypeImage,
    CloudinaryFileUploadInterceptor,
  )
  async update(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto,
  ): Promise<Topic> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }
    return this.topicsService.update(id, updateTopicDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Sai định dạng id');
    }
    return this.topicsService.remove(id);
  }
}
