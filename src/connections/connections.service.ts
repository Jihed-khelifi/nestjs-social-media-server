import { Injectable, Inject, forwardRef, HttpStatus } from '@nestjs/common';
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
            isConnected: false,
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
            isConnected: false,
          },
        },
        $set: {
          userId: user.id,
        },
      });

    await bulk.execute();

    const userToFollowConnection = await this.connectionMongoRepository
      .aggregate([
        {
          $match: {
            _id: userToFollowDoc.connection,
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            followers: 1,
            following: 1,
          },
        },
      ])
      .toArray();

    let mutualConnectionExists: number;

    if (userToFollowConnection.length) {
      mutualConnectionExists = userToFollowConnection[0]?.following?.findIndex(
        (follow) => follow.userId === user.id,
      );
    }

    if (mutualConnectionExists) {
      await this.connectionMongoRepository.updateOne(
        { _id: userToFollowDoc.connection },
        {
          $set: {
            'followers.$[].isConnected': true,
          },
        },
      );
      await this.connectionMongoRepository.updateOne(
        { _id: userToFollowDoc.connection },
        {
          $set: {
            'following.$[].isConnected': true,
          },
        },
      );
      await this.connectionMongoRepository.updateOne(
        { _id: user.connection },
        {
          $set: {
            'following.$[].isConnected': true,
          },
        },
      );
      await this.connectionMongoRepository.updateOne(
        { _id: user.connection },
        {
          $set: {
            'followers.$[].isConnected': true,
          },
        },
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
            isConnected: false,
          },
        },
      });

    bulk
      .find({ _id: user.connection })
      .upsert()
      .updateOne({
        $pull: {
          following: {
            userId: userToUnfollowId,
            username: userToUnFollowDoc.username,
            isConnected: false,
          },
        },
      });
    await bulk.execute();

    const userToUnFollowConnection = await this.connectionMongoRepository
      .aggregate([
        {
          $match: {
            _id: userToUnFollowDoc.connection,
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            followers: 1,
            following: 1,
          },
        },
      ])
      .toArray();

    let mutualConnectionExists: number;

    if (userToUnFollowConnection.length) {
      mutualConnectionExists =
        userToUnFollowConnection[0]?.following?.findIndex(
          (follow) => follow.userId === user.id,
        );
    }

    if (mutualConnectionExists) {
      await this.connectionMongoRepository.updateOne(
        { _id: userToUnFollowDoc.connection },
        {
          $set: {
            'followers.$[].isConnected': false,
          },
        },
      );
      await this.connectionMongoRepository.updateOne(
        { _id: userToUnFollowDoc.connection },
        {
          $set: {
            'following.$[].isConnected': false,
          },
        },
      );
      await this.connectionMongoRepository.updateOne(
        { _id: user.connection },
        {
          $set: {
            'following.$[].isConnected': false,
          },
        },
      );
      await this.connectionMongoRepository.updateOne(
        { _id: user.connection },
        {
          $set: {
            'followers.$[].isConnected': false,
          },
        },
      );
    }

    return HttpStatus.ACCEPTED;
  }
}
