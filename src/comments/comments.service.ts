import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ObjectId } from 'mongodb';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private commentMongoRepository: MongoRepository<CommentEntity>,
  ) {}
  async createComment(commentDto: CreateCommentDto, userId) {
    const data: any = {
      comment: commentDto.comment,
      postId: new ObjectId(commentDto.postId),
      mentions: commentDto.mentions.map((id) => new ObjectId(id)),
      userId: new ObjectId(userId),
    };
    if (commentDto.commentId) {
      data.commentId = new ObjectId(commentDto.commentId);
    }
    return this.commentMongoRepository.save(data);
  }
  async getPostComments(postId) {
    return this.commentMongoRepository.findBy({ postId: new ObjectId(postId) });
  }
}
