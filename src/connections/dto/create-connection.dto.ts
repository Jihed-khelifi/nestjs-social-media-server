import { ObjectID } from 'typeorm';

export class CreateConnectionsDto {
  userId: ObjectID;
  followers: any[];
  following: any[];
}
