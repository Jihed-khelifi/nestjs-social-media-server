import { Module } from '@nestjs/common';

import {TypeOrmModule} from "@nestjs/typeorm";
import {CommentEntity} from "./entities/comment.entity";
import {CommentsService} from "./comments.service";
import {CommentsController} from "./comments.controller";

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity])],
  controllers: [CommentsController],
  providers: [CommentsService]
})
export class CommentsModule {}
