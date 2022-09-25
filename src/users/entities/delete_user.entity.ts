import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';
import { User } from './user.entity';

@Entity('delete_user')
export class DeleteUserEntity {
  @ObjectIdColumn({ name: '_id' })
  id: ObjectID;

  @ObjectIdColumn({ name: 'userId' })
  userId: ObjectID;

  @Column()
  user: User;

  @Column({ type: 'timestamp', nullable: false })
  deleteRequestedOn: Date;

  @Column({ type: 'timestamp', nullable: false })
  toBeDeletedOn: Date;

  @Column({ default: false })
  deleted: boolean;
}
