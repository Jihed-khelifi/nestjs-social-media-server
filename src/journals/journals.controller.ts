import {Controller, Get, Post, Body, Request, UseGuards, Param, Put, Delete, Ip, Query} from '@nestjs/common';
import { JournalsService } from './journals.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import { ObjectId } from 'mongodb';
import {UpdateJournalDto} from "./dto/update-journal.dto";
import {RealIP} from "nestjs-real-ip";
import {UsersService} from "../users/users.service";
const axios = require('axios').default;

@Controller('journals')
export class JournalsController {
  constructor(private readonly journalsService: JournalsService, private userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createJournalDto: CreateJournalDto) {
    createJournalDto.createdBy = new ObjectId(req.user.id);
    if (createJournalDto.type === 'public') {
      createJournalDto.userLocation = req.user.location;
      createJournalDto.userCountry = req.user.country;
    }
    return this.journalsService.create(createJournalDto);
  }
  @UseGuards(JwtAuthGuard)
  @Put()
  update(@Request() req, @Body() updateJournalDto: UpdateJournalDto) {
    return this.journalsService.update(updateJournalDto);
  }
  @UseGuards(JwtAuthGuard)
  @Get('getSingle/:postId')
  getPostById(@Param('postId') postId: string) {
    return this.journalsService.getSinglePost(postId);
  }
  @UseGuards(JwtAuthGuard)
  @Get('count/public')
  countPublicPosts(@Request() req) {
    return this.journalsService.countPublicPosts(req.user);
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyAllDataByDate(@Request() req) {
    let user = req.user;
    return this.journalsService.minePosts(user);
  }
  @UseGuards(JwtAuthGuard)
  @Get('community/:type')
  async getCommunityPosts(@Param('type') type: string, @Query('page') page: number = 0, @Request() req, @RealIP() ip: string) {
    let user = req.user;
    if (type === 'country' && !req.user.country) {
      const api = `${process.env.ABSTRACT_API_URL}&ip_address=${ip}`;
      await axios.get(api).then(async res => {
        if (res.status === 200 || res.status === 201) {
          const {city, country, region, latitude, longitude} = res.data;
          user = await this.userService.updateUser(new ObjectId(user.id), {
            ...{
              city,
              country,
              state: region,
              location: {
                type: 'Point',
                coordinates: [longitude, latitude]
              }
            }
          })
        }
      });
    }
    return this.journalsService.getCommunityPosts(user, type, page);
  }
  @UseGuards(JwtAuthGuard)
  @Get('changeUserOnlineStatus/:online')
  async changeUserOnlineStatus(@Param('online') online: boolean, @Request() req) {
    await this.userService.updateUser(new ObjectId(req.user.id), {isOnline: online});
  }
}
