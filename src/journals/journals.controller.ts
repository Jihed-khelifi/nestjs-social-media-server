import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  Param,
  Put,
  Delete,
  Ip,
  Query,
} from '@nestjs/common';
import { JournalsService } from './journals.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ObjectId } from 'mongodb';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { RealIP } from 'nestjs-real-ip';
import { UsersService } from '../users/users.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';

import axios from 'axios';
import { PostTypeJournalDto } from './dto/post-type-journal.dto';

@Controller('journals')
export class JournalsController {
  constructor(
    private readonly journalsService: JournalsService,
    private userService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createJournalDto: CreateJournalDto) {
    createJournalDto.createdBy = new ObjectId(req.user.id);
    return this.journalsService.create(createJournalDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  update(@Request() req, @Body() updateJournalDto: UpdateJournalDto) {
    return this.journalsService.update(updateJournalDto, req.user);
  }
  @UseGuards(JwtAuthGuard)
  @Put('changePostType')
  changePostType(
    @Request() req,
    @Body() postTypeJournalDto: PostTypeJournalDto,
  ) {
    return this.journalsService.updatePostType(postTypeJournalDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getSingle/:postId')
  getPostById(@Request() req, @Param('postId') postId: string) {
    return this.journalsService.getPostsByCondition(req.user, {
      _id: new ObjectId(postId),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('count/public')
  countPublicPosts(@Request() req) {
    return this.journalsService.countPublicPosts(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyAllDataByDate(@Request() req) {
    const user = req.user;
    return this.journalsService.minePosts(user);
  }
  @UseGuards(AdminJwtAuthGuard)
  @Get('getPostsForAdmin')
  async getPostsForAdmin(@Query('page') page = 0) {
    return this.journalsService.getPostsForAdmin(page);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('community/:type')
  async getCommunityPosts(
    @Param('type') type: string,
    @Query('page') page = 0,
    @Request() req,
    @RealIP() ip: string,
  ) {
    let user = req.user;
    if (type === 'country' && user && !req.user.country) {
      const api = `${process.env.ABSTRACT_API_URL}&ip_address=${ip}`;
      await axios.get(api).then(async (res) => {
        if (res.status === 200 || res.status === 201) {
          const { city, country, region, latitude, longitude } = res.data;
          user = await this.userService.updateUser(new ObjectId(user.id), {
            ...{
              city,
              country,
              state: region,
              location: {
                type: 'Point',
                coordinates: [longitude, latitude],
              },
            },
          });
        }
      });
    }
    if (!user) {
      const api = `${process.env.ABSTRACT_API_URL}&ip_address=${ip}`;
      const res = await axios.get(api);
      if (res.status === 200 || res.status === 201) {
        const { city, countryName, regionName, latitude, longitude } = res.data;
        user = {
          city,
          country: countryName,
          state: regionName,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        };
      }
    }
    return this.journalsService.getCommunityPosts(user, type, page);
  }

  @UseGuards(JwtAuthGuard)
  @Get('changeUserOnlineStatus/:online')
  async changeUserOnlineStatus(
    @Param('online') online: string,
    @Request() req,
  ) {
    await this.userService.updateUser(new ObjectId(req.user.id), {
      isOnline: online === 'true',
    });
  }
  @UseGuards(JwtAuthGuard)
  @Get('getMyPostsOfDate/:date')
  async getMyPostsOfDate(@Param('date') date: string, @Request() req) {
    return this.journalsService.getMyPostsOfDate(req.user, date);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getMinutesOfEmotions/:month')
  async getMinutesOfEmotions(@Param('month') month: number, @Request() req) {
    return this.journalsService.getMinutesOfEmotions(req.user, {
      month: +month,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('getMoodDistributionMonthly')
  async getMoodDistributionMonthly(@Request() req) {
    return this.journalsService.moodDistributionAggregationGroupByMonth(
      req.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('getInsightsData/:startDate/:endDate')
  async getInsightsData(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
    @Request() req,
  ) {
    return this.journalsService.getInsightsData(req.user, startDate, endDate);
  }
  @UseGuards(JwtAuthGuard)
  @Get('getMonthMarked/:month/:year')
  async getMonthMarked(
    @Param('month') month: number,
    @Param('year') year: number,
    @Request() req,
  ) {
    return this.journalsService.getMonthMarked(req.user, {
      month: +month,
      year: +year,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Param('id') id: string, @Request() req) {
    return this.journalsService.delete(id, req.user);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Delete('removePostAdmin/:id')
  async removePostByAdmin(@Param('id') id: string) {
    return this.journalsService.removePostByAdmin(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getConnectionsPosts/:type')
  async getConnectionsPosts(
    @Request() req,
    @Param('type') type: string,
    @Query('page') page = 0,
  ) {
    return this.journalsService.getCommunityPosts(req.user, type, page);
  }
  @UseGuards(JwtAuthGuard)
  @Get('getUserPublicPosts/:userId')
  async getUserPublicPosts(
    @Param('userId') userId: string,
    @Query('page') page = 0,
  ) {
    return this.journalsService.getUserPublicPosts(userId, page);
  }
}
