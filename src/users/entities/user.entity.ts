import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity('users')
export class User {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;
}
