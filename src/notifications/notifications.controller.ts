import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.notificationsService.sendNotification(
      'Hello ' + req.user.username,
      [req.user.id],
    );
  }
}
