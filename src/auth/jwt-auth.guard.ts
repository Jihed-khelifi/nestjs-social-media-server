import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    if (user && user.isBanned) {
      throw new ForbiddenException(
        'Your account is banned by admin. Please contact support@continuem.co',
      );
    }
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
