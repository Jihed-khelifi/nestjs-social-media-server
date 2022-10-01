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
import * as randomstring from 'randomstring';
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
  @Post('verify-change-password-otp')
  async verifyChangePasswordOtp(@Body() body: { otp: string; userId: string }) {
    if (body.otp) {
      const user = await this.userService.findOne(new ObjectId(body.userId));
      if (!user) {
        throw new HttpException('Invalid User Id', HttpStatus.UNAUTHORIZED);
      } else {
        await this.userService.updateUser(user.id, { otpVerified: true });
      }
    } else {
      throw new HttpException('Invalid Request', HttpStatus.UNAUTHORIZED);
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
