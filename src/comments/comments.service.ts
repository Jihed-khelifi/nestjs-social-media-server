import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ObjectId } from 'mongodb';
import { NotificationsService } from '../notifications/notifications.service';
import { ReportService } from '../report/report.service';

@Injectable()
export class CommentsService {
  constructor(
    private notificationsService: NotificationsService,
    @InjectRepository(CommentEntity)
    private commentMongoRepository: MongoRepository<CommentEntity>,
    private reportService: ReportService,
  ) {}
  async createComment(commentDto: CreateCommentDto, userId) {
    const data: any = {
      comment: commentDto.comment,
      postId: new ObjectId(commentDto.postId),
      mentions: commentDto.mentions
        ? commentDto.mentions.map((id) => new ObjectId(id))
        : [],
      userId: new ObjectId(userId),
    };
    if (commentDto.commentId) {
      data.commentId = new ObjectId(commentDto.commentId);
    }
    const comment = await this.commentMongoRepository.save(data);
    await this.notificationsService.createCommentOnPostNotification(
      data.postId,
      data.commentId,
      comment.id,
      userId,
      data.mentions,
    );
    return comment;
  }
  async getPostComments(postId) {
    return this.commentMongoRepository.findBy({ postId: new ObjectId(postId) });
  }
  async getCommentById(id) {
    return this.commentMongoRepository.findOneById(id);
  }
  async editComment(commentId, userId, commentMessage) {
    return this.commentMongoRepository.update(
      {
        id: new ObjectId(commentId),
        userId: new ObjectId(userId),
      },
      { comment: commentMessage, isEdited: true },
    );
  }
  async updateCommentWithPostId(
    commentId,
    userId,
    postId,
    commentDto: CreateCommentDto,
  ) {
    const data: any = {
      comment: commentDto.comment,
      mentions: commentDto.mentions
        ? commentDto.mentions.map((id) => new ObjectId(id))
        : [],
    };
    return this.commentMongoRepository.update(
      {
        id: new ObjectId(commentId),
        userId: new ObjectId(userId),
        postId: new ObjectId(postId),
      },
      { ...data, isEdited: true },
    );
  }
  async deleteComment(commentId) {
    await this.commentMongoRepository.update(
      { id: new ObjectId(commentId) },
      { status: 'deleted' },
    );
    await this.reportService.markStatus(commentId, 'deleted');
  }
  async removeCommentByAdmin(id) {
    const comment = await this.commentMongoRepository.findOne(new ObjectId(id));
    if (comment) {
      await this.commentMongoRepository.update(
        { id: new ObjectId(id) },
        { status: 'removed' },
      );
      await this.reportService.markStatus(id, 'removed');
      await this.notificationsService.createAdminRemovedCommentNotification(
        comment.userId,
      );
    } else {
      throw new HttpException('Not found', 404);
    }
    return comment;
  }
}
