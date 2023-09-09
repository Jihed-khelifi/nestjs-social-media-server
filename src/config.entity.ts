import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity('config')
export class ConfigEntity {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  googleClientKey: string;
}
