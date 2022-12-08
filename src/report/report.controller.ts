import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportDto } from './dto/report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ObjectId } from 'mongodb';
import { UsersService } from '../users/users.service';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import { JournalsService } from '../journals/journals.service';
import { CommentsService } from '../comments/comments.service';

@Controller('report')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly journalService: JournalsService,
    private readonly commentService: CommentsService,
    private userService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() reportDto: ReportDto) {
    const report = await this.reportService.find(reportDto.dataId, req.user.id);
    if (report) {
      throw new HttpException('Report Already Created', HttpStatus.CONFLICT);
    }
    let userReported: ObjectId = null;
    if (reportDto.type === 'journal') {
      const post = await this.journalService.getPostById(reportDto.dataId);
      if (post) {
        userReported = post.createdBy;
      }
    } else {
      const comment = await this.commentService.getCommentById(
        reportDto.dataId,
      );
      if (comment) {
        userReported = comment.userId;
      }
    }
    reportDto.reportedBy = new ObjectId(req.user.id);
    reportDto.status = 'REPORTED';
    reportDto.reportedUser = userReported;
    return this.reportService.create(reportDto);
  }
  @UseGuards(AdminJwtAuthGuard)
  @Get()
  async getReportedData() {
    return this.reportService.getAllReportedData();
  }
}
