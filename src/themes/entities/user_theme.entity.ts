import { Entity, ObjectIdColumn, ObjectID, Column } from 'typeorm';

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
}
