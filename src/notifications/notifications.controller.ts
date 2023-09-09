import {
  Controller,
  Get,
  Param,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) { }

  @UseGuards(JwtAuthGuard)
  @Get('getUserNotifications')
  async getUserNotifications(@Request() req) {
    return this.notificationsService.getUserNotifications(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':status')
  async getMyNotifications(@Request() req, @Param('status') status: string) {
    return this.notificationsService.getMyNotification(status, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  readNotification(@Request() req, @Param('id') id: string) {
    return this.notificationsService.readNotification(id, req.user.id);
  }

}
