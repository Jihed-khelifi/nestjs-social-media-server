import {
  Entity,
  Column,
  ObjectIdColumn,
  ObjectID,
  CreateDateColumn,
} from 'typeorm';

@Entity('comments')
export class CommentEntity {
  @ObjectIdColumn()
  id: ObjectID;

  @ObjectIdColumn({ name: 'postId' })
  postId: ObjectID;

  @ObjectIdColumn({ name: 'userId' })
  userId: ObjectID;

  @ObjectIdColumn({ name: 'commentId' })
  commentId: ObjectID;

  @Column()
  comment: string;

  @Column()
  status: string;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ name: 'mentionedUsers' })
  mentionedUsers: ObjectID[];

  @CreateDateColumn()
  createdAt: Date;
}
