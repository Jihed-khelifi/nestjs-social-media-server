import { ObjectID } from 'typeorm';
import { FollowCard } from '../entities/connections.entity';

export class CreateConnectionsDto {
  userId: ObjectID;
  followers: FollowCard[];
  following: FollowCard[];
  connections: FollowCard[];
}
