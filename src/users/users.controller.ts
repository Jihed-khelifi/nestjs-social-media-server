import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
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
import * as bcrypt from 'bcrypt';
import { CreateLinkAccountUserDto } from './dto/create-link-account-user.dto';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';

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
  // @UseGuards(JwtAuthGuard)
  @Get('getUserByProfessionalCode/:code')
  getUserByProfessionalCode(@Request() req, @Param('code') code: string) {
    return this.userService.getUserByProfessionalCode(code);
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
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      return await this.userService.updateUser(req.user.id, updateUserDto);
    }
    throw new HttpException('Action not permitted.', HttpStatus.BAD_REQUEST);
  }
  @UseGuards(JwtAuthGuard)
  @Delete()
  async deleteAccount(@Request() req) {
    return this.userService.deleteAccount(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Post('requestShareDataToProfessional')
  async requestShareDataToProfessional(
    @Body() createLinkAccountUserDto: CreateLinkAccountUserDto,
  ) {
    return this.userService.requestShareDataToProfessional(
      createLinkAccountUserDto,
    );
  }
  @UseGuards(AdminJwtAuthGuard)
  @Get('banUnbanUser/:userId')
  async banUser(@Param('userId') userId: string) {
    return this.userService.banUnbanUser(userId);
  }
  @UseGuards(JwtAuthGuard)
  @Get('blockUnblockUser/:userId')
  async blockUnblockUser(@Request() req, @Param('userId') userId: string) {
    if (req.user) {
      return this.userService.blockUnblockUser(req.user, userId);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('getBlockedUsers')
  async getBlockedUsers(@Request() req) {
    return this.userService.getBlockedUsers(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getUser')
  async getUser(@Request() req) {
    return this.userService.findOne(req.user.id);
  }
}
