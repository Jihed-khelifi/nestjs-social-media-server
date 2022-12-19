import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ProfessionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    if (!user.isProfessional) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
