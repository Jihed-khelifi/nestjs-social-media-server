import {
  Entity,
  Column,
  ObjectIdColumn,
  ObjectID,
  CreateDateColumn,
} from 'typeorm';
import { Emotion } from '../../emotions/entities/emotion.entity';

@Entity('journals')
export class Journal {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  emotions: Emotion[];

  @Column()
  category: string;

  @Column()
  description: string;

  @Column()
  type: string;

  @Column()
  status: string;

  @ObjectIdColumn({ name: 'createdBy' })
  createdBy: ObjectID;

  @CreateDateColumn()
  createdAt: Date;
}
