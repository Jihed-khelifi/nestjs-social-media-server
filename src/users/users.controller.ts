import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserDobDto } from './dto/user-dob.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ObjectId } from 'mongodb';
import { ThemesService } from '../themes/themes.service';
import { UserUsernameDto } from './dto/user-username.dto';

@Controller('users')
export class UsersController {
  constructor(
    private userService: UsersService,
    private themeService: ThemesService,
  ) {}
  @UseGuards(JwtAuthGuard)
  @Put()
  updateDob(@Request() req, @Body() userDobDto: UserDobDto) {
    try {
      userDobDto.dob = new Date(userDobDto.dob);
      return this.userService.updateDob(req.user.id, userDobDto);
    } catch (e) {
      console.log(e);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('recoverAccount')
  recoverAccount(@Request() req) {
    return this.userService.recoverAccount(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Put('username')
  updateUsername(@Request() req, @Body() userUsernameDto: UserUsernameDto) {
    try {
      return this.userService.updateUsername(req.user.id, userUsernameDto);
    } catch (e) {
      console.log(e);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Put('theme')
  async updateTheme(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    try {
      updateUserDto.theme = new ObjectId(updateUserDto.theme);
      const user = await this.userService.updateUser(
        req.user.id,
        updateUserDto,
      );
      await this.themeService.applyTheme(updateUserDto.theme, req.user.id);
      return user;
    } catch (e) {
      console.log(e);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Put('changePassword')
  async changePassword(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    if (req.user.otpVerified) {
      return await this.userService.updateUser(req.user.id, updateUserDto);
    }
    throw new HttpException('Action not permitted.', HttpStatus.BAD_REQUEST);
  }
  @UseGuards(JwtAuthGuard)
  @Delete()
  async deleteAccount(@Request() req) {
    return this.userService.deleteAccount(req.user.id);
  }
}
