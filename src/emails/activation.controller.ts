import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Controller()
export class ActivationController {
  constructor(private userService: UsersService) {}
  @Get('verify-account')
  async verifyAccount(@Query() query) {
    if (query.activationKey) {
      const user = await this.userService.findByActivationKey(
        query.activationKey,
      );
      if (!user) {
        throw new HttpException(
          'Invalid Activation Key',
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        if (user.isActive) {
          return `<div>
              <h1>Account Already Verified</h1>
              <p>Your account is already verified. Try login to the application.</p>
            </div>`;
        }
        await this.userService.activateUser(user.id);
      }
    } else {
      throw new HttpException('Invalid Request', HttpStatus.UNAUTHORIZED);
    }
    return `<div>
              <h1>Account Verified</h1>
              <p>Congratulations, your account is verified. Now you can login to the app.</p>
            </div>`;
  }
}
