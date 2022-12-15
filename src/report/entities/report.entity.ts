import {
  Entity,
  Column,
  ObjectIdColumn,
  ObjectID,
  CreateDateColumn,
} from 'typeorm';

@Entity('reported_data')
export class ReportEntity {
  @ObjectIdColumn({ name: 'id' })
  id: ObjectID;

  @ObjectIdColumn({ name: 'dataId' })
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
