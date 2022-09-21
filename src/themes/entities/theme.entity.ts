import {
  Entity,
  Column,
  ObjectIdColumn,
  ObjectID,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('themes')
export class ThemeEntity {
  @ObjectIdColumn({ name: '_id' })
  _id: ObjectID;

  @ObjectIdColumn({ name: 'userId' })
  userId: ObjectID;

  @Column()
  name: string;

  @Column()
  bgColor: string;

  @Column()
  borderColor: string;

  @Column()
  cardBackground: string;

  @Column()
  routineTextColor: string;

  @Column()
  primaryColor: string;

  @Column()
  primaryTextColor: string;

  @Column()
  accentColor: string;

  @Column()
  positiveColor: string;

  @Column()
  negativeColor: string;

  @Column()
  neutralColor: string;

  @Column()
  positiveTextColor: string;

  @Column()
  negativeTextColor: string;

  @Column()
  neutralTextColor: string;

  @Column()
  secondaryBackgroundColor: string;

  @Column({ default: true })
  default: boolean;

  @Column({ default: false })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
