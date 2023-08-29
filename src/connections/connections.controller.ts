import { Controller, Param, Post } from '@nestjs/common';
import { Get, UseGuards, Request } from '@nestjs/common';

import { ConnectionsService } from './connections.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('getFollowing')
  getFollowing(@Request() req) {
    return this.connectionsService.getFollowing(req.user.id);
  }

  @Get('all')
  getAll() {
    return this.connectionsService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('getFollowers')
  getFollowers(@Request() req) {
    return this.connectionsService.getFollowers(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('followUser/:userToFollow')
  followUser(@Request() req, @Param('userToFollow') userToFollow) {
    return this.connectionsService.follow(req.user.id, userToFollow);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unfollowUser/:userToUnfollow')
  unfollowUser(@Request() req, @Param('userToUnfollow') userToUnfollow) {
    return this.connectionsService.unfollow(req.user.id, userToUnfollow);
  }
}
