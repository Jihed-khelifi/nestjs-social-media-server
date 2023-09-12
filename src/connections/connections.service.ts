import { Injectable, Inject, forwardRef, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, ObjectID } from 'typeorm';
import { ConnectionEntity } from './entities/connections.entity';
import { User } from 'src/users/entities/user.entity';
import { ObjectID as ObjectId } from 'mongodb';
import { UsersService } from 'src/users/users.service';
import { CreateConnectionsDto } from './dto/create-connection.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(ConnectionEntity)
    private connectionMongoRepository: MongoRepository<ConnectionEntity>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationService: NotificationsService,
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
            $unwind: {
              path: '$follower',
            },
          },
          {
            $project: {
              _id: 1,
              userId: 1,
              isConnected: 1,
              'follower.first_name': 1,
              'follower.last_name': 1,
              'follower.username': 1,
              'follower.avatar': 1,
              'follower.isActive': 1,
              'follower.isOnline': 1,
              'follower._id': 1,
              'follower.isProfessional': 1,
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
          $unwind: {
            path: '$follower',
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            isConnected: 1,
            'follower.first_name': 1,
            'follower.last_name': 1,
            'follower.username': 1,
            'follower.avatar': 1,
            'follower.isActive': 1,
            'follower.isOnline': 1,
            'follower._id': 1,
            'follower.isProfessional': 1,
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
          userFollowers[i].follower._id.toString()
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
            $unwind: {
              path: '$followingUser',
            },
          },
          {
            $project: {
              _id: 1,
              userId: 1,
              isConnected: 1,
              'followingUser.first_name': 1,
              'followingUser.last_name': 1,
              'followingUser.username': 1,
              'followingUser.avatar': 1,
              'followingUser.isActive': 1,
              'followingUser.isOnline': 1,
              'followingUser._id': 1,
              'followingUser.isProfessional': 1,
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
          $unwind: {
            path: '$followingUser',
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            isConnected: 1,
            'followingUser.first_name': 1,
            'followingUser.last_name': 1,
            'followingUser.username': 1,
            'followingUser.avatar': 1,
            'followingUser.isActive': 1,
            'followingUser.isOnline': 1,
            'followingUser._id': 1,
            'followingUser.isProfessional': 1,
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
          userFollowings[i].followingUser._id.toString()
        ) {
          userFollowings[i].isFollowing = true;
        }
      }
    }

    return userFollowings;
  }

  async getConnections(connectedUser: User, userId: ObjectID) {
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
              connections: 1,
              isFollowing: {
                $cond: {
                  if: {
                    $in: [new ObjectId(connectedUser.id), '$following.userId'],
                  },
                  then: true,
                  else: false,
                },
              },
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
            $unwind: {
              path: '$connections',
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'connections.userId',
              foreignField: '_id',
              as: 'connectionUser',
            },
          },
          
          {
            $unwind: {
              path: '$connectionUser',
            },
          },
          {
            $project: {
              _id: 1,
              userId: 1,
              connectionUser: 1,
              isConnected: 1,
              'connectionUser.password': 0,
            },
          },
        ])
        .toArray();
    }

    const userConnections = await this.connectionMongoRepository
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
            path: '$connections',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'connections.userId',
            foreignField: '_id',
            as: 'connectionUser',
          },
        },
        {
          $unwind: {
            path: '$connectionUser',
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            isConnected: 1,
            connectionUser: 1,
            'connectionUser.password': 0,
          },
        },
      ])
      .toArray();

    const connectedUserConnectionDoc =
      await this.connectionMongoRepository.findOneBy({
        userId: new ObjectId(connectedUser.id),
      });

    for (let i = 0; i < userConnections.length; i++) {
      userConnections[i].isFollowing = false;
      for (const connectedUserFollowing of connectedUserConnectionDoc.following) {
        if (
          connectedUserFollowing.userId.toString() ===
          userConnections[i].connectionUser[0]._id.toString()
        ) {
          userConnections[i].isFollowing = true;
        }
      }
    }
    return userConnections;
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

    let isConnection = false;

    for (const following of userConnection.following) {
      if (following.userId.toString() === userToFollowId.toString()) {
        await this.addConnection(user, userToFollowId);
        isConnection = true;
      }
    }

    if (isConnection) {
      this.notificationService.createNewConnectionNotification(
        user.id,
        userToFollowId,
      );
    } else {
      this.notificationService.createNewFollowerNotification(
        user.id,
        userToFollowId,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Followed successfully',
    };
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
        await this.removeConnection(user, userToUnfollowId);
        break;
      }
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Unfollowed successfully',
    };
  }
  async removeSupporter(user: User, supporterUserId: ObjectID) {
    const supporterUserDoc = await this.usersService.findOne(supporterUserId);
    const bulk = this.connectionMongoRepository.initializeUnorderedBulkOp({});
    bulk
      .find({ userId: new ObjectId(user.id) })
      .upsert()
      .updateOne({
        $pull: {
          followers: {
            userId: new ObjectId(user.id),
          },
        },
      });

    bulk
      .find({ userId: new ObjectId(supporterUserDoc.id) })
      .upsert()
      .updateOne({
        $pull: {
          following: {
            userId: new ObjectId(user.id),
          },
        },
      });
    await bulk.execute();
    const userConnectionDoc = await this.connectionMongoRepository.findOneBy({
      userId: new ObjectId(user.id),
    });
    for (const followingUser of userConnectionDoc.connections) {
      if (followingUser.userId.toString() === supporterUserDoc.id.toString()) {
        break;
      }
      await this.removeConnection(supporterUserDoc, user.id);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Follower removed successfully',
    };
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

  async getFollowersIds(user): Promise<ObjectID[]> {
    const userConnection = await this.connectionMongoRepository.findOneBy({
      userId: new ObjectId(user.id),
    });
    console.log(user.id)
    const followersIds: ObjectID[] = [];
    for (const follower of userConnection.followers) {
      followersIds.push(new ObjectId(follower.userId));
    }
    return followersIds;
  }
  async getFollowingsIds(user): Promise<ObjectID[]> {
    const userConnection = await this.connectionMongoRepository.findOneBy({
      userId: new ObjectId(user.id),
    });
    const followingsIds: ObjectID[] = [];
    for (const following of userConnection.following) {
      followingsIds.push(new ObjectId(following.userId));
    }
    return followingsIds;
  }

  async getConnectionsIds(user): Promise<ObjectID[]> {
    const userConnection = await this.connectionMongoRepository.findOneBy({
      userId: new ObjectId(user.id),
    });
    const connectionsIds: ObjectID[] = [];
    for (const connection of userConnection.connections) {
      connectionsIds.push(new ObjectId(connection.userId));
    }
    return connectionsIds;
  }

  async findOneBy(id: ObjectID) {
    return await this.connectionMongoRepository.findOneBy({
      userId: new ObjectId(id),
    });
  }
}
