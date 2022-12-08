import {
  Entity,
  Column,
  ObjectIdColumn,
  ObjectID,
  CreateDateColumn,
} from 'typeorm';

@Entity('reported_data')
export class ReportEntity {
  @ObjectIdColumn()
  id: ObjectID;

  @ObjectIdColumn()
  dataId: ObjectID;

  @Column()
  type: string;

  @Column()
  status: string;

  @Column()
  reason: string;

  @ObjectIdColumn({ name: 'reportedBy' })
  reportedBy: ObjectID;

  @ObjectIdColumn({ name: 'reportedUser' })
  reportedUser: ObjectID;

  @CreateDateColumn()
  reportedAt: Date;
}
