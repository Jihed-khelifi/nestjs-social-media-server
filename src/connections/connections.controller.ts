import { Controller, Param, Post, Delete } from '@nestjs/common';
import { Get, UseGuards, Request } from '@nestjs/common';

import { ConnectionsService } from './connections.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get('all')
  getAll() {
    return this.connectionsService.getAll();
  }

  @Delete('delete')
  deleteAll() {
    return this.connectionsService.deleteAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('getFollowing/:userId')
  getFollowing(@Request() req, @Param('userId') userId) {
    return this.connectionsService.getFollowing(req.user, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getFollowers/:userId')
  getFollowers(@Request() req, @Param('userId') userId) {
    return this.connectionsService.getFollowers(req.user, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('followUser/:userToFollow')
  followUser(@Request() req, @Param('userToFollow') userToFollow) {
    return this.connectionsService.follow(req.user, userToFollow);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unfollowUser/:userToUnfollow')
  unfollowUser(@Request() req, @Param('userToUnfollow') userToUnfollow) {
    return this.connectionsService.unfollow(req.user, userToUnfollow);
  }
}
