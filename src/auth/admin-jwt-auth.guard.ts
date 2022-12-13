import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    if (!user.isAdmin) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
