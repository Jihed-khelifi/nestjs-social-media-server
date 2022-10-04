import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.createComment(createCommentDto, req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Get(':postId')
  getPostComments(@Request() req, @Param('postId') postId: string) {
    return this.commentsService.getPostComments(postId);
  }
}
