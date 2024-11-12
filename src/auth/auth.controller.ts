import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponeMessage } from 'src/decorator/customize';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { Request as ReqExpress, Response } from 'express';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserService } from 'src/users/users.service';

import { JwtAuthGuard } from './passport/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) response: Response) {
    const ip = req?.ip || req.headers['x-forwarded-for'];
    console.log('User IP:', ip);
    return this.authService.login(req.user, response);
  }

  @ResponeMessage('Refresh access_token')
  @Post('refresh')
  refreshToken(
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { refreshToken } = body;
    return this.authService.checkTokenRefresh(refreshToken, response);
  }
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ResponeMessage('LogOut')
  logOut(
    @Req() @Request() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logOut(req.user, response);
  }
}
