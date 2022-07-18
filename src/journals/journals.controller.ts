import {Controller, Get, Post, Body, Request, UseGuards, Param, Put} from '@nestjs/common';
import { JournalsService } from './journals.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import { ObjectId } from 'mongodb';
import {UpdateJournalDto} from "./dto/update-journal.dto";

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
  @Get(':type')
  getMyAllDataByDate(@Param('type') type: string, @Request() req) {
    let user = null;
    if (type === 'mine') {
      user = req.user;
    }
    return this.journalsService.aggregateByDate(user);
  }
}
