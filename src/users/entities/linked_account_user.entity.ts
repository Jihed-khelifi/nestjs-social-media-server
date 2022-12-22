import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';
import { User } from './user.entity';

@Entity('linked_account_user')
export class LinkedAccountUserEntity {
  @ObjectIdColumn({ name: '_id' })
  id: ObjectID;

  @ObjectIdColumn({ name: 'userId' })
  userId: ObjectID;

  @ObjectIdColumn({ name: 'linkedUserId' })
  linkedUserId: ObjectID;

  @Column()
  professionalCode: string;

  @Column()
  linkType: string;

  @Column()
  status: string;

  @Column({ default: false })
  shareEmotionJournal: boolean;

  @Column({ default: false })
  sharePublicJournal: boolean;

  @Column({ default: false })
  dontShowIndividualData: boolean;
}
