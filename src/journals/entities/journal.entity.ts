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

  @Column({ default: false })
  isEdited: boolean;

  @Column()
  isTriggering: boolean;

  @Column()
  emotionCanBeLogged: boolean;

  @Column()
  isEncrypted: boolean;

  @ObjectIdColumn({ name: 'createdBy' })
  createdBy: ObjectID;

  @CreateDateColumn()
  createdAt: Date;
}
