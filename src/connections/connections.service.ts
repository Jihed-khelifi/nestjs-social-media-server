import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, ObjectID } from 'typeorm';
import { ConnectionEntity } from './entities/connections.entity';
import { User } from 'src/users/entities/user.entity';
import { ObjectId } from 'mongodb';
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

  async getFollowers(user: User) {
    console.log(user);
    return this.connectionMongoRepository
      .aggregate([
        {
          $match: {
            _id: user.connection,
          },
        },
        {
          $project: {
            _id: 1,
            followers: 1,
            userId: 1,
          },
        },
      ])
      .toArray();
  }

  async getFollowing(user: User) {
    return this.connectionMongoRepository
      .aggregate([
        {
          $match: {
            _id: user.connection,
          },
        },
        // {
        //   $lookup: {
        //     from: 'users',
        //     localField: 'following.userId',
        //     foreignField: 'id',
        //     as: 'following',
        //   },
        // },
        {
          $project: {
            _id: 1,
            userId: 1,
            following: 1,
          },
        },
      ])
      .toArray();
  }

  async follow(user: User, userToFollowId: ObjectID) {
    const bulk = this.connectionMongoRepository.initializeUnorderedBulkOp({});
    const userToFollowDoc = await this.usersService.findOne(userToFollowId);
    bulk
      .find({ _id: userToFollowDoc.connection })
      .upsert()
      .updateOne({
        $addToSet: {
          followers: {
            userId: user.id,
            username: user.username,
          },
        },
        $set: {
          userId: userToFollowId,
        },
      });

    bulk
      .find({ _id: user.connection })
      .upsert()
      .updateOne({
        $addToSet: {
          following: {
            userId: userToFollowId,
            username: userToFollowDoc.username,
          },
        },
        $set: {
          userId: user.id,
        },
      });

    await bulk.execute();

    const userToFollowConnection =
      await this.connectionMongoRepository.findOneBy({
        where: {
          userId: userToFollowId,
          followers: { $elemMatch: { userId: user.id } },
          // following: { $elemMatch: { userId: userToFollowId } },
        },
      });

    const currentUserConnection =
      await this.connectionMongoRepository.findOneBy({
        userId: user.id,
        // followers: { $elemMatch: { userId: userToFollowId } },
        following: { $elemMatch: { userId: user.id } },
      });

    // If both conditions are met, set isConnected to true for both users
    if (userToFollowConnection && currentUserConnection) {
      await this.connectionMongoRepository.updateOne(
        { userId: userToFollowId },
        { $set: { 'following.isConnected': true } },
      );
      console.log('jihed');
      await this.connectionMongoRepository.updateOne(
        { userId: userToFollowId },
        { $set: { 'followers.isConnected': true } },
      );

      await this.connectionMongoRepository.updateOne(
        { userId: user.id },
        { $set: { 'followers.isConnected': true } },
      );
      await this.connectionMongoRepository.updateOne(
        { userId: user.id },
        { $set: { 'following.isConnected': true } },
      );
    }
    return this.connectionMongoRepository.find({});
  }

  async unfollow(user: User, userToUnfollowId: ObjectID) {
    const userToUnFollowDoc = await this.usersService.findOne(userToUnfollowId);

    const bulk = this.connectionMongoRepository.initializeUnorderedBulkOp({});
    bulk
      .find({ _id: userToUnFollowDoc.connection })
      .upsert()
      .updateOne({
        $pull: {
          followers: {
            userId: user.id,
            username: user.username,
          },
        },
        // change isConnected status
      });

    bulk
      .find({ _id: user.connection })
      .upsert()
      .updateOne({
        $pull: {
          following: {
            userId: userToUnfollowId,
            username: userToUnFollowDoc.username,
          },
        },
      });
    await bulk.execute();

    // const userToFollowConnection =
    //   await this.connectionMongoRepository.findOneBy({
    //     userId: userToUnfollowId,
    //     followers: { $elemMatch: { user.id } },
    //     following: { $elemMatch: { userId: userToUnfollowId } },
    //   });

    // const currentUserConnection =
    //   await this.connectionMongoRepository.findOneBy({
    //     userId: userId,
    //     followers: { $elemMatch: { userId: userToUnfollowId } },
    //     following: { $elemMatch: { userId } },
    //   });

    // // If both conditions are met, set isConnected to true for both users
    // if (userToFollowConnection && currentUserConnection) {
    //   await this.connectionMongoRepository.updateOne(
    //     { userId: userToUnfollowId },
    //     { $set: { isConnected: false } },
    //   );

    //   await this.connectionMongoRepository.updateOne(
    //     { userId: userId },
    //     { $set: { isConnected: false } },
    //   );
    // }

    return this.connectionMongoRepository.find({});
  }
}
