import { Body, Controller, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserDobDto } from './dto/user-dob.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ObjectId } from 'mongodb';
import { ThemesService } from '../themes/themes.service';
import { raw } from 'express';
import {UserUsernameDto} from "./dto/user-username.dto";

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
}
