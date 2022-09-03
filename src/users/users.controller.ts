import {
  Body,
  Controller, Put, Request, UseGuards,
} from '@nestjs/common';
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {UserDobDto} from "./dto/user-dob.dto";
import {UsersService} from "./users.service";
import {UpdateUserDto} from "./dto/update-user.dto";
import {ObjectId} from 'mongodb';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}
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
  @Put('theme')
  updateTheme(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    try {
      updateUserDto.theme = new ObjectId(updateUserDto.theme);
      return this.userService.updateUser(req.user.id, updateUserDto);
    } catch (e) {
      console.log(e);
    }
  }
}
