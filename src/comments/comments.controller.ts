import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createCommentDto: CreateCommentDto) {
    if (createCommentDto._id) {
      return this.commentsService.editComment(
        createCommentDto._id,
        req.user.id,
        createCommentDto.comment,
      );
    }
    return this.commentsService.createComment(createCommentDto, req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Get(':postId')
  getPostComments(@Request() req, @Param('postId') postId: string) {
    return this.commentsService.getPostComments(postId);
  }
  @UseGuards(JwtAuthGuard)
  @Put(':commentId')
  editComment(
    @Request() req,
    @Param('commentId') commentId: string,
    @Body() body: { message },
  ) {
    return this.commentsService.editComment(
      commentId,
      req.user.id,
      body.message,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  deleteComment(@Request() req, @Param('commentId') commentId: string) {
    return this.commentsService.deleteComment(commentId);
  }
  @UseGuards(AdminJwtAuthGuard)
  @Delete('removeCommentAdmin/:commentId')
  async removePostByAdmin(@Param('commentId') commentId: string) {
    return this.commentsService.removeCommentByAdmin(commentId);
  }
}
