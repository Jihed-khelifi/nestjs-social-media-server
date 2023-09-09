import {
  Controller,
  Request,
  Post,
  UseGuards,
  Get,
  Body,
  UnauthorizedException,
  ForbiddenException,
  ValidationPipe,
} from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { ThemesService } from '../themes/themes.service';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class AuthController {
  constructor(
    private themeService: ThemesService,
    private usersService: UsersService,
  ) {}
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    if (req.user.isBanned) {
      throw new ForbiddenException(
        'Your account is banned by admin. Please contact support@continuem.co',
      );
    }
    return req.user;
  }
  @UseGuards(LocalAuthGuard)
  @Post('/professional-login')
  async professionalLogin(@Request() req) {
    if (req.user.isBanned) {
      throw new ForbiddenException(
        'Your account is banned by admin. Please contact support@continuem.co',
      );
    }
    if (!req.user.isProfessional) {
      throw new UnauthorizedException();
    }
    return req.user;
  }
  @Post('/register')
  async register(@Body() createUserDto: CreateUserDto) {
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    return this.usersService.create(createUserDto);
  }
  @Post('/professional-register')
  async professionalRegister(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ) {
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    createUserDto.professionalCode = Math.random()
      .toString(36)
      .substring(2, 9)
      .toUpperCase();
    createUserDto.isProfessional = true;
    return this.usersService.create(createUserDto);
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  async getProfile(@Request() req) {
    req.user.theme = await this.themeService.getTheme(req.user.theme);
    return req.user;
  }
}
