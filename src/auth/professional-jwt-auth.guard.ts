import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ProfessionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    if (user.isBanned) {
      throw new ForbiddenException(
        'Your account is banned by admin. Please contact support@continuem.co',
      );
    }
    if (!user.isProfessional) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
