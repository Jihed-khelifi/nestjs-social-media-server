import {
  Entity,
  Column,
  ObjectIdColumn,
  ObjectID,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class NotificationEntity {
  @ObjectIdColumn()
  id: ObjectID;

  @ObjectIdColumn({ name: 'relatedUserId' })
  relatedUserId: ObjectID;

  @ObjectIdColumn({ name: 'userId' })
  userId: ObjectID;

  @Column()
  type: string;

  @Column()
  notificationMessage: string;

  @Column()
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
