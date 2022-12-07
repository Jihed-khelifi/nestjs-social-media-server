import {
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(username);
    if (user) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        return this.login(user);
      }
    }
    return null;
  }

  async login(user: User, justSignedup?) {
    const payload = { email: user.email, sub: user.id };
    if (!user.isActive && !justSignedup) {
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
      isAdmin: user.isAdmin,
      message: 'User logged in successfully.',
    };
  }
}
