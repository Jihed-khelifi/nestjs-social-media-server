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
    if (connectedUser.id.toString() === userId.toString()) {
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
              connections: 1,
              isConnected: {
                $cond: {
                  if: {
                    $in: [
                      new ObjectId(connectedUser.id),
                      '$connections.userId',
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'followers.userId',
              foreignField: '_id',
              as: 'follower',
            },
          },
          {
            $unwind: {
              path: '$followers',
            },
          },
          {
            $addFields: {
              isFollowing: true,
            },
          },
          {
            $project: {
              _id: 1,
              userId: 1,
              follower: 1,
              isFollowing: 1,
              isConnected: 1,
            },
          },
        ])
        .toArray();
    }
    const userFollowers = await this.connectionMongoRepository
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
            connections: 1,
            isConnected: {
              $cond: {
                if: {
                  $in: [new ObjectId(connectedUser.id), '$connections.userId'],
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
          $lookup: {
            from: 'users',
            localField: 'followers.userId',
            foreignField: '_id',
            as: 'follower',
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            isConnected: 1,
            follower: 1,
          },
        },
      ])
      .toArray();

    const connectedUserConnectionDoc =
      await this.connectionMongoRepository.findOneBy({
        userId: new ObjectId(connectedUser.id),
      });

    for (let i = 0; i < userFollowers.length; i++) {
      userFollowers[i].isFollowing = false;
      for (const connectedUserFollowing of connectedUserConnectionDoc.following) {
        if (
          connectedUserFollowing.userId.toString() ===
          userFollowers[i].follower[0]._id.toString()
        ) {
          userFollowers[i].isFollowing = true;
        }
      }
    }
    return userFollowers;
  }

  async getFollowing(connectedUser: User, userId: ObjectID) {
    if (connectedUser.id.toString() === userId.toString()) {
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
              connections: 1,
              isConnected: {
                $cond: {
                  if: {
                    $in: [
                      new ObjectId(connectedUser.id),
                      '$connections.userId',
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'following.userId',
              foreignField: '_id',
              as: 'followingUser',
            },
          },
          {
            $unwind: {
              path: '$following',
            },
          },
          {
            $addFields: {
              isFollowing: true,
            },
          },
          {
            $project: {
              _id: 1,
              userId: 1,
              followingUser: 1,
              isFollowing: 1,
              isConnected: 1,
            },
          },
        ])
        .toArray();
    }

    const userFollowings = await this.connectionMongoRepository
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
            connections: 1,
            isConnected: {
              $cond: {
                if: {
                  $in: [new ObjectId(connectedUser.id), '$connections.userId'],
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
          $lookup: {
            from: 'users',
            localField: 'following.userId',
            foreignField: '_id',
            as: 'followingUser',
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            isConnected: 1,
            followingUser: 1,
          },
        },
      ])
      .toArray();

    const connectedUserConnectionDoc =
      await this.connectionMongoRepository.findOneBy({
        userId: new ObjectId(connectedUser.id),
      });

    for (let i = 0; i < userFollowings.length; i++) {
      userFollowings[i].isFollowing = false;
      for (const connectedUserFollowing of connectedUserConnectionDoc.following) {
        if (
          connectedUserFollowing.userId.toString() ===
          userFollowings[i].followingUser[0]._id.toString()
        ) {
          userFollowings[i].isFollowing = true;
        }
      }
    }

    return userFollowings;
  }

  async follow(user: User, userToFollowId: ObjectID) {
    const bulk = this.connectionMongoRepository.initializeUnorderedBulkOp({});
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
          },
        },
        $set: {
          userId: new ObjectId(user.id),
        },
      });

    await bulk.execute();

    const userConnection = await this.connectionMongoRepository.findOneBy({
      userId: new ObjectId(user.id),
    });

    for (const following of userConnection.following) {
      if (following.userId.toString() === userToFollowId.toString()) {
        await this.addConnection(user, userToFollowId);
      }
    }

    return this.connectionMongoRepository.find({});
  }

  async unfollow(user: User, userToUnfollowId: ObjectID) {
    const userToUnFollowDoc = await this.usersService.findOne(userToUnfollowId);

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
    for (const followingUser of newUserToUnfollowConnectionDoc.connections) {
      if (followingUser.userId.toString() === user.id.toString()) {
        break;
      }
      this.removeConnection(user, userToUnfollowId);
    }

    return HttpStatus.ACCEPTED;
  }

  async addConnection(user: User, userToSetConnectionStatusId: ObjectID) {
    await this.connectionMongoRepository.updateOne(
      {
        userId: new ObjectId(userToSetConnectionStatusId),
      },
      {
        $addToSet: {
          connections: {
            userId: new ObjectId(user.id),
          },
        },
      },
      { upsert: true },
    );
    await this.connectionMongoRepository.updateOne(
      {
        userId: new ObjectId(user.id),
      },
      {
        $addToSet: {
          connections: {
            userId: new ObjectId(userToSetConnectionStatusId),
          },
        },
      },
      { upsert: true },
    );
  }

  async removeConnection(user: User, userToRemoveConnectionStatusId: ObjectID) {
    await this.connectionMongoRepository.updateOne(
      {
        userId: new ObjectId(userToRemoveConnectionStatusId),
      },
      {
        $pull: {
          connections: {
            userId: new ObjectId(user.id),
          },
        },
      },
    );
    await this.connectionMongoRepository.updateOne(
      {
        userId: new ObjectId(user.id),
      },
      {
        $pull: {
          connections: {
            userId: new ObjectId(userToRemoveConnectionStatusId),
          },
        },
      },
    );
  }
}
