import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity('comments')
export class CommentEntity {
    @ObjectIdColumn()
    id: ObjectID;

    @ObjectIdColumn()
    postId: ObjectID;

    @ObjectIdColumn()
    userId: ObjectID;

    @Column()
    comment: string;
}
