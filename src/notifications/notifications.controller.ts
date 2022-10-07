import {Controller, Get, Param, Put, Request, UseGuards} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  @UseGuards(JwtAuthGuard)
  @Get('')
  getPostComments(@Request() req) {
    return this.notificationsService.getMyNotification(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  readNotification(@Request() req, @Param('id') id: string) {
    return this.notificationsService.readNotification(id, req.user.id);
  }
}
