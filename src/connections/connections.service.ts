import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, ObjectID } from 'typeorm';
import { ConnectionEntity } from './entities/connections.entity';
import { User } from 'src/users/entities/user.entity';
import { ObjectId } from 'mongodb';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(ConnectionEntity)
    private connectionMongoRepository: MongoRepository<ConnectionEntity>,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  async getAll() {
    return this.connectionMongoRepository.find({});
  }

  async getFollowers(userId: ObjectID) {
    return this.connectionMongoRepository
      .aggregate([
        {
          $match: {
            userId: userId,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'followers.userId',
            foreignField: 'id',
            as: 'followers',
          },
        },
        {
          $project: {
            _id: 0,
            followers: 1,
          },
        },
      ])
      .toArray();
  }

  async getFollowing(userId: ObjectID) {
    return this.connectionMongoRepository
      .aggregate([
        {
          $match: {
            userId: userId,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'following.userId',
            foreignField: 'id',
            as: 'following',
          },
        },
        {
          $project: {
            _id: 0,
            following: 1,
          },
        },
      ])
      .toArray();
  }

  async follow(userId: ObjectID, userToFollowId) {
    const bulk = this.connectionMongoRepository.initializeUnorderedBulkOp({});
    bulk
      .find({ userId: userId })
      .upsert()
      .updateOne({
        $addToSet: {
          followers: {
            userId: new ObjectId(userId),
            username: (await this.usersService.findOne(userId)).username,
          },
        },
      });

    bulk
      .find({ userId: userId })
      .upsert()
      .updateOne({
        $addToSet: {
          following: {
            userId: new ObjectId(userToFollowId),
            username: (await this.usersService.findOne(userToFollowId))
              .username,
          },
        },
      });

    await bulk.execute();
    return this.connectionMongoRepository.find({});
  }

  async unfollow(userId: ObjectId, userToUnfollowId: ObjectID) {
    const bulk = this.connectionMongoRepository.initializeUnorderedBulkOp({});
    bulk
      .find({ userId: userId })
      .upsert()
      .updateOne({
        $pull: {
          followers: {
            userId: new ObjectId(userId),
            username: (await this.usersService.findOne(userId)).username,
          },
        },
      });

    bulk
      .find({ userId: userId })
      .upsert()
      .updateOne({
        $pull: {
          following: {
            userId: new ObjectId(userToUnfollowId),
            username: (await this.usersService.findOne(userToUnfollowId))
              .username,
          },
        },
      });
    await bulk.execute();

    return this.connectionMongoRepository.find({});
  }
}
