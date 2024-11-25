import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateForgotPasswordDto } from './dto/create-forgot-password.dto';
import { ForgotPassword } from './forgot-password.schema';
import { UserService } from 'src/users/users.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class ForgotPasswordService {
  constructor(
    @InjectModel(ForgotPassword.name)
    private forgotPasswordModel: Model<ForgotPassword>,
    private readonly userService: UserService, // Inject UserService để xử lý người dùng
  ) {}

  async create(
    createForgotPasswordDto: CreateForgotPasswordDto,
  ): Promise<string> {
    const { email } = createForgotPasswordDto;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration time
    const expiredAt = new Date();
    expiredAt.setSeconds(expiredAt.getSeconds() + 180);

    // Kiểm tra xem email đã tồn tại chưa
    const existingRecord = await this.forgotPasswordModel.findOne({ email });

    if (existingRecord) {
      // Cập nhật OTP và thời gian hết hạn nếu tồn tại
      existingRecord.otp = otp;
      existingRecord.expiredAt = expiredAt;
      await existingRecord.save();
    } else {
      // Tạo bản ghi mới nếu email chưa tồn tại
      await this.forgotPasswordModel.create({ email, otp, expiredAt });
    }

    // Gửi OTP qua email (ví dụ, dùng service email giả)
    console.log(`Gửi OTP ${otp} đến email ${email}`);

    return 'OTP đã được gửi đến email của bạn';
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<string> {
    const { email, otp, passNew } = verifyOtpDto;

    // Tìm bản ghi có email và OTP
    const record = await this.forgotPasswordModel.findOne({ email, otp });

    // Nếu không tìm thấy bản ghi hoặc OTP không hợp lệ
    if (!record) {
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    }
    // Xóa bản ghi OTP sau khi đổi mật khẩu thành công
    await this.forgotPasswordModel.deleteOne({ email });
    // Đổi mật khẩu người dùng
    await this.userService.changePasswordByOTP(email, passNew);

    return 'Đã đặt lại mật khẩu mới !';
  }
}