import {Entity, Column, ObjectIdColumn, ObjectID, CreateDateColumn} from 'typeorm';

@Entity('comments')
export class CommentEntity {
    @ObjectIdColumn()
    id: ObjectID;

    @ObjectIdColumn()
    postId: ObjectID;

    @ObjectIdColumn()
    userId: ObjectID;

    @ObjectIdColumn()
    commentId: ObjectID;

    @Column()
    comment: string;

    @CreateDateColumn()
    createdAt: Date;
}
