import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(username);
    if (user && user.password === pass) {
      return this.login(user);
    }
    return null;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    if (!user.isActive) {
      await this.usersService.sendOtp(user);
    }
    let data = {
      deleteRequestedOn: null,
    };
    if (user.deleteRequested) {
      data = await this.usersService.getDeleteRequest(user.id);
    }
    return {
      access_token: this.jwtService.sign(payload),
      isActive: user.isActive,
      dob: user.dob,
      userName: user.name,
      email: user.email,
      userId: user.id,
      deleteRequested: user.deleteRequested,
      deleteRequestedOn: data.deleteRequestedOn,
      message: 'User logged in successfully.',
    };
  }
}
