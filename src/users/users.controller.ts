import {
  Body,
  Controller, Get, Put, Request, UseGuards,
} from '@nestjs/common';
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {UserDobDto} from "./dto/user-dob.dto";
import {UsersService} from "./users.service";
import { ObjectId } from 'mongodb';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}
  @UseGuards(JwtAuthGuard)
  @Put()
  update(@Request() req, @Body() userDobDto: UserDobDto) {
    try {
      userDobDto.dob = new Date(userDobDto.dob);
      return this.userService.updateDob(req.user.id, userDobDto);
    } catch (e) {
      console.log(e);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('nearByUsers')
  nearByUsers(@Request() req) {
    return this.userService.getNearbyActiveUsers(req.user);
  }
}
