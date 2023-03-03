import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    if (user.isBanned) {
      throw new ForbiddenException(
        'Your account is banned by admin. Please contact support@continuem.co',
      );
    }
    return user;
  }
}
