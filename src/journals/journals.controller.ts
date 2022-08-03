import {Controller, Get, Post, Body, Request, UseGuards, Param, Put, Delete, Ip} from '@nestjs/common';
import { JournalsService } from './journals.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import { ObjectId } from 'mongodb';
import {UpdateJournalDto} from "./dto/update-journal.dto";
import {RealIP} from "nestjs-real-ip";

@Controller('journals')
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createJournalDto: CreateJournalDto) {
    createJournalDto.createdBy = new ObjectId(req.user.id);
    return this.journalsService.create(createJournalDto);
  }
  @UseGuards(JwtAuthGuard)
  @Put()
  update(@Request() req, @Body() updateJournalDto: UpdateJournalDto) {
    return this.journalsService.update(updateJournalDto);
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.journalsService.findAll(req.user);
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
  @Get(':type')
  getMyAllDataByDate(@Param('type') type: string, @Request() req, @RealIP() ip: string) {
    console.log(ip);
    console.log(req.ip);
    return this.journalsService.aggregateByDate(req.user, type);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteJournal(@Param('id') id: string, @Request() req) {
    return this.journalsService.delete(id, req.user);
  }
}
