import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { ObjectId } from 'mongodb';

@Controller()
export class ActivationController {
  constructor(
    private userService: UsersService,
    private emailService: EmailService,
  ) {}
  @Post('verify-account')
  async verifyAccount(@Body() body: { otp: string; userId: string }) {
    if (body.otp) {
      const user = await this.userService.findOne(new ObjectId(body.userId));
      if (!user) {
        throw new HttpException('Invalid User Id', HttpStatus.UNAUTHORIZED);
      } else {
        if (user.isActive) {
          return {
            userActivated: true,
            error: false,
          };
        }
        await this.userService.activateUser(user.id);
        return {
          userActivated: true,
          error: false,
        };
      }
    } else {
      throw new HttpException('Invalid Request', HttpStatus.UNAUTHORIZED);
    }
  }
  hashCode = (str) => {
    return str
      .split('')
      .reduce(
        (prevHash, currVal) =>
          ((prevHash << 5) - prevHash + currVal.charCodeAt(0)) | 0,
        0,
      );
  };
  @Post('verify-change-password-otp')
  async verifyChangePasswordOtp(@Body() body: { otp: string; email: string }) {
    if (body.otp) {
      const user = await this.userService.findByEmail(body.email);
      if (!user) {
        throw new HttpException('Invalid User Id', HttpStatus.UNAUTHORIZED);
      } else {
        if (user.otp === body.otp) {
          await this.userService.updateUser(user.id, { otpVerified: true });
          return this.hashCode(user.otp);
        } else {
          throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
        }
      }
    } else {
      throw new HttpException('Invalid Request', HttpStatus.UNAUTHORIZED);
    }
  }
  @Post('change-password')
  async changePassword(
    @Body() body: { password: string; hash: string; userId: string },
  ) {
    const user = await this.userService.findOne(new ObjectId(body.userId));
    if (!user) {
      throw new HttpException('Invalid User Id', HttpStatus.UNAUTHORIZED);
    } else {
      if (this.hashCode(user.otp) === body.hash) {
        await this.userService.updateUser(user.id, { password: body.password });
      } else {
        throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
      }
    }
  }
  @Get('get-activation-email/:id')
  async getActivationEmail(@Param('id') id: string) {
    const user = await this.userService.findOne(new ObjectId(id));
    await this.userService.sendOtp(user);
  }
  @Post('get-change-password-email')
  async getChangePasswordEmail(@Body() body: { email: string }) {
    const user = await this.userService.findByEmail(body.email);
    if (!user) {
      throw new HttpException(
        'User not found with this email address.',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.userService.sendChangePasswordOtp(user);
  }
}
