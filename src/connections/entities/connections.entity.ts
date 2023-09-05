import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity('connections')
export class ConnectionEntity {
  @ObjectIdColumn()
  id: ObjectID;

  @ObjectIdColumn({ name: 'userId' })
  userId: ObjectID;

  @Column((type) => FollowCard)
  followers: FollowCard[];

  @Column((type) => FollowCard)
  following: FollowCard[];

  @Column((type) => FollowCard)
  connections: FollowCard[];
}

@Entity('followcard')
export class FollowCard {
  @ObjectIdColumn({ name: 'userId' })
  userId: ObjectID;
}
