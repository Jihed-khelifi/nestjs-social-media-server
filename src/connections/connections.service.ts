import { Injectable, Inject, forwardRef, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, ObjectID } from 'typeorm';
import { ConnectionEntity } from './entities/connections.entity';
import { User } from 'src/users/entities/user.entity';
import { ObjectID as ObjectId } from 'mongodb';
import { UsersService } from 'src/users/users.service';
import { CreateConnectionsDto } from './dto/create-connection.dto';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(ConnectionEntity)
    private connectionMongoRepository: MongoRepository<ConnectionEntity>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async getAll() {
    return this.connectionMongoRepository.find({});
  }

  async deleteAll() {
    return this.connectionMongoRepository.deleteMany({});
  }

  async createConnection(connectionDto: CreateConnectionsDto) {
    return this.connectionMongoRepository.save({
      ...connectionDto,
    });
  }

  async getFollowers(connectedUser: User, userId: ObjectID) {
    return this.connectionMongoRepository
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            followers: 1,
            isFollowing: {
              $cond: {
                if: {
                  $in: [new ObjectId(connectedUser.id), '$followers.userId'],
                },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $unwind: {
            path: '$followers',
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            isFollowing: 1,
            followerId: '$followers.userId',
            username: '$followers.username',
            isConnected: '$followers.isConnected',
          },
        },
      ])
      .toArray();
  }

  async getFollowing(connectedUser: User, userId: ObjectID) {
    return this.connectionMongoRepository
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            following: 1,
            isFollowing: {
              $cond: {
                if: {
                  $in: [new ObjectId(connectedUser.id), '$followers.userId'],
                },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $unwind: {
            path: '$following',
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            followingUserId: '$following.userId',
            isFollowing: 1,
            username: '$following.username',
            isConnected: '$following.isConnected',
          },
        },
      ])
      .toArray();
  }

  async follow(user: User, userToFollowId: ObjectID) {
    const bulk = this.connectionMongoRepository.initializeUnorderedBulkOp({});
    const userToFollowDoc = await this.usersService.findOne(userToFollowId);
    const userToFollowConnectionDoc =
      await this.connectionMongoRepository.findOneBy({
        userId: new ObjectId(userToFollowId),
      });

    if (userToFollowConnectionDoc) {
      for (const follower of userToFollowConnectionDoc.followers) {
        if (follower.userId.toString() === user.id.toString()) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'You already follow this user',
          };
        }
      }
    }

    bulk
      .find({ userId: new ObjectId(userToFollowId) })
      .upsert()
      .updateOne({
        $addToSet: {
          followers: {
            userId: new ObjectId(user.id),
            username: user.username,
            isConnected: false,
          },
        },
        $set: {
          userId: new ObjectId(userToFollowId),
        },
      });

    bulk
      .find({ userId: new ObjectId(user.id) })
      .upsert()
      .updateOne({
        $addToSet: {
          following: {
            userId: new ObjectId(userToFollowId),
            username: userToFollowDoc.username,
            isConnected: false,
          },
        },
        $set: {
          userId: new ObjectId(user.id),
        },
      });

    await bulk.execute();

    if (userToFollowConnectionDoc) {
      for (const followingUser of userToFollowConnectionDoc.following) {
        if (followingUser.userId.toString() === user.id.toString()) {
          const results = this.setConnectionStatus(user, userToFollowId, true);
          return results;
        }
      }
    }

    return this.connectionMongoRepository.find({});
  }

  async unfollow(user: User, userToUnfollowId: ObjectID) {
    const userToUnFollowDoc = await this.usersService.findOne(userToUnfollowId);

    const userToUnfollowConnectionDoc =
      await this.connectionMongoRepository.findOneBy({
        userId: new ObjectId(userToUnfollowId),
      });

    const bulk = this.connectionMongoRepository.initializeUnorderedBulkOp({});
    bulk
      .find({ userId: new ObjectId(userToUnFollowDoc.id) })
      .upsert()
      .updateOne({
        $pull: {
          followers: {
            userId: new ObjectId(user.id),
          },
        },
      });

    bulk
      .find({ userId: new ObjectId(user.id) })
      .upsert()
      .updateOne({
        $pull: {
          following: {
            userId: new ObjectId(userToUnfollowId),
          },
        },
      });
    await bulk.execute();

    const newUserToUnfollowConnectionDoc =
      await this.connectionMongoRepository.findOneBy({
        userId: new ObjectId(userToUnfollowId),
      });
    for (const followingUser of newUserToUnfollowConnectionDoc.following) {
      if (followingUser.userId.toString() === user.id.toString()) {
        this.setConnectionStatus(user, userToUnfollowId, false);
      }
    }

    return HttpStatus.ACCEPTED;
  }

  async setConnectionStatus(
    user: User,
    userToSetConnectionStatusId: ObjectID,
    status: boolean,
  ) {
    const userToSetConnectionStatus =
      await this.connectionMongoRepository.findOneBy({
        userId: new ObjectId(userToSetConnectionStatusId),
      });

    if (!userToSetConnectionStatus) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'User not found',
      };
    }
    for (const follower of userToSetConnectionStatus.followers) {
      if (follower.userId.toString() === user.id.toString()) {
        follower.isConnected = status;
      }
    }
    for (const follower of userToSetConnectionStatus.following) {
      if (follower.userId.toString() === user.id.toString()) {
        follower.isConnected = status;
      }
    }

    await this.connectionMongoRepository.updateOne(
      {
        userId: new ObjectId(userToSetConnectionStatusId),
      },
      {
        $set: {
          followers: userToSetConnectionStatus.followers,
          following: userToSetConnectionStatus.following,
        },
      },
    );

    const userConnection = await this.connectionMongoRepository.findOneBy({
      userId: new ObjectId(user.id),
    });

    if (!userConnection) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'User not found',
      };
    }
    for (const follower of userConnection.followers) {
      if (
        follower.userId.toString() === userToSetConnectionStatusId.toString()
      ) {
        follower.isConnected = status;
      }
    }
    for (const follower of userConnection.following) {
      if (
        follower.userId.toString() === userToSetConnectionStatusId.toString()
      ) {
        follower.isConnected = status;
      }
    }
    return this.connectionMongoRepository.updateOne(
      {
        userId: new ObjectId(user.id),
      },
      {
        $set: {
          followers: userConnection.followers,
          following: userConnection.following,
        },
      },
    );
  }
}
