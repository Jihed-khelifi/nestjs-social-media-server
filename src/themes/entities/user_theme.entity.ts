import {
  Entity,
  ObjectIdColumn,
  ObjectID,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_themes')
export class UserThemeEntity {
  @ObjectIdColumn({ name: '_id' })
  _id: ObjectID;

  @ObjectIdColumn({ name: 'themeId' })
  themeId: ObjectID;

  @ObjectIdColumn({ name: 'userId' })
  userId: ObjectID;

  @Column({ default: false })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
