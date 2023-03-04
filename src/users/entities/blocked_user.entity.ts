import { Entity, ObjectIdColumn, ObjectID, CreateDateColumn } from 'typeorm';

@Entity('blocked_users')
export class BlockedUsersEntity {
  @ObjectIdColumn({ name: '_id' })
  id: ObjectID;

  @ObjectIdColumn({ name: 'blockedBy' })
  blockedBy: ObjectID;

  @ObjectIdColumn({ name: 'blockedTo' })
  blockedTo: ObjectID;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  blockedOn: Date;
}
