import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
import { forwardRef } from '@nestjs/common/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, ObjectID } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import * as OneSignal from '@onesignal/node-onesignal';
import { JournalsService } from '../journals/journals.service';
import { UsersService } from '../users/users.service';
import { ObjectId } from 'mongodb';
import { User } from 'src/users/entities/user.entity';
import { BlockedUsersEntity } from '../users/entities/blocked_user.entity';

const ONESIGNAL_APP_ID = '92a64123-4fb9-4c5b-90eb-b789794f168d';
const app_key_provider = {
  getToken() {
    return 'OTkzN2ZiOGMtODEyZC00OTE5LWJiYTgtY2E2Mzc0NjQ0YWZm';
  },
};

@Injectable()
export class NotificationsService {
  client: any;

  constructor(
    private journalsService: JournalsService,
    @InjectRepository(NotificationEntity)
    private notificationEntityMongoRepository: MongoRepository<NotificationEntity>,
    @InjectRepository(BlockedUsersEntity)
    private blockedUsersEntityMongoRepository: MongoRepository<BlockedUsersEntity>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {
    const configuration = OneSignal.createConfiguration({
      authMethods: {
        app_key: {
          tokenProvider: app_key_provider,
        },
      },
    });
    this.client = new OneSignal.DefaultApi(configuration);
  }
  public async readNotification(id, userId) {
    await this.notificationEntityMongoRepository.update(
      { id: new ObjectId(id), userId },
      { read: true },
    );
  }
  public async getMyNotification(status, userId) {
    let read = true;
    if (status === 'unread') {
      read = false;
    }
    return this.notificationEntityMongoRepository
      .aggregate([
        {
          $match: {
            userId,
            read,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'relatedUserId',
            foreignField: '_id',
            as: 'relatedUser',
          },
        },
        {
          $lookup: {
            from: 'comments',
            localField: 'commentId',
            foreignField: '_id',
            as: 'commentedOn',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        { $unwind: '$relatedUser' },
        {
          $lookup: {
            from: 'journals',
            localField: 'postId',
            foreignField: '_id',
            pipeline: [
              {
                $lookup: {
                  from: 'users',
                  localField: 'createdBy',
                  foreignField: '_id',
                  as: 'user',
                },
              },
              { $unwind: '$user' },
              {
                $project: {
                  'user.password': 0,
                  'user.activationKey': 0,
                  'user.otp': 0,
                  'user.otpSentAt': 0,
                  'user.isActive': 0,
                },
              },
              {
                $lookup: {
                  from: 'comments',
                  localField: '_id',
                  foreignField: 'postId',
                  pipeline: [
                    {
                      $match: {
                        commentId: null,
                      },
                    },
                    {
                      $lookup: {
                        from: 'comments',
                        localField: '_id',
                        foreignField: 'commentId',
                        pipeline: [
                          {
                            $lookup: {
                              from: 'users',
                              localField: 'userId',
                              foreignField: '_id',
                              pipeline: [
                                {
                                  $lookup: {
                                    from: 'journals',
                                    localField: '_id',
                                    foreignField: 'createdBy',
                                    pipeline: [
                                      { $sort: { createdAt: -1 } },
                                      {
                                        $limit: 1,
                                      },
                                    ],
                                    as: 'last_journal',
                                  },
                                },
                                { $unwind: '$last_journal' },
                              ],
                              as: 'user',
                            },
                          },
                          { $unwind: '$user' },
                          {
                            $project: {
                              'user.password': 0,
                              'user.activationKey': 0,
                              'user.isActive': 0,
                              'user.otpSentAt': 0,
                              'user.otp': 0,
                            },
                          },
                        ],
                        as: 'replies',
                      },
                    },
                    {
                      $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        pipeline: [
                          {
                            $lookup: {
                              from: 'journals',
                              localField: '_id',
                              foreignField: 'createdBy',
                              pipeline: [
                                { $sort: { createdAt: -1 } },
                                {
                                  $limit: 1,
                                },
                              ],
                              as: 'last_journal',
                            },
                          },
                          { $unwind: '$last_journal' },
                        ],
                        as: 'user',
                      },
                    },
                    { $unwind: '$user' },
                    {
                      $project: {
                        'user.password': 0,
                        'user.activationKey': 0,
                        'user.otp': 0,
                        'user.otpSentAt': 0,
                        'user.isActive': 0,
                      },
                    },
                    { $sort: { createdAt: -1 } },
                  ],
                  as: 'comments',
                },
              },
            ],
            as: 'post',
          },
        },
        { $unwind: '$post' },
        {
          $project: {
            'user.password': 0,
            'user.activationKey': 0,
            'user.otp': 0,
            'user.otpSentAt': 0,
            'user.isActive': 0,
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();
  }
  public async getUserNotifications(user: User) {
    const blockedUsers = [];
    if (user.id) {
      const blocked = await this.blockedUsersEntityMongoRepository.findBy({
        $or: [{ blockedBy: user.id }],
      });
      for (const u of blocked) {
        blockedUsers.push(u.blockedTo);
      }
    }
    const pipelines = [
      {
        $match: {
          userId: user.id,
        },
      },
      {
        $match: {
          relatedUserId: {
            $nin: blockedUsers,
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'relatedUserId',
          foreignField: '_id',
          as: 'relatedUser',
        },
      },
      { $unwind: '$relatedUser' },
      {
        $addFields: {
          username: '$relatedUser.username',
          avatar: '$relatedUser.avatar',
        },
      },
      {
        $project: {
          relatedUser: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ];
    return this.notificationEntityMongoRepository
      .aggregate(pipelines)
      .toArray();
  }

  // public async getUserNotifications(user: User) {
  //   return this.notificationEntityMongoRepository.findBy({
  //     userId: new ObjectId(user.id),
  //   });
  // }

  public async createCommentOnPostNotification(
    postId,
    commentId,
    dataId,
    userId,
    mentions: string[],
  ) {
    const posts = await this.journalsService.getPostsByCondition(null, {
      _id: postId,
    });
    const post = posts[0];
    post.comments = [];
    const user = await this.usersService.findOne(new ObjectId(userId));
    if (
      post.createdBy.toString() !== userId.toString() &&
      !mentions.includes(post.createdBy.toString())
    ) {
      const notification: any = {};
      notification.notificationMessage = `${user.username} commented on your post.`;
      notification.userId = post.createdBy;
      notification.relatedUserId = userId;
      notification.postId = postId;
      notification.createdAt = new Date();
      notification.read = false;
      notification.dataId = postId;
      notification.type = 'MY_POST_COMMENT';
      await this.sendNotification(
        notification.notificationMessage,
        [post.createdBy.toString()],
        { ...post },
      );
      await this.notificationEntityMongoRepository.save(notification);
    }
    for (const mention of mentions) {
      if (mention.toString() !== userId.toString()) {
        const mentionNotification: any = {};
        mentionNotification.notificationMessage = `${user.username} mentioned you in a comment.`;
        mentionNotification.userId = mention;
        mentionNotification.relatedUserId = userId;
        mentionNotification.postId = postId;
        mentionNotification.createdAt = new Date();
        mentionNotification.read = false;
        mentionNotification.dataId = dataId;
        mentionNotification.commentId = commentId;
        mentionNotification.type = 'MENTION_IN_COMMENT';
        await this.sendNotification(
          mentionNotification.notificationMessage,
          [mention.toString()],
          { ...post },
        );
        await this.notificationEntityMongoRepository.save(mentionNotification);
      }
    }
  }

  async createNewFollowerNotification(userId, followerId) {
    const user = await this.usersService.findOne(followerId);
    const notification: any = {};
    notification.notificationMessage = `${user.username} is now supporting you`;
    notification.userId = userId;
    notification.relatedUserId = followerId;
    notification.createdAt = new Date();
    notification.read = false;
    notification.type = 'NEW_FOLLOWER';
    await this.sendNotification(
      notification.notificationMessage,
      [followerId.toString()],
      followerId,
    );
    await this.notificationEntityMongoRepository.save(notification);
  }

  async createNewConnectionNotification(userId, userConnectionId) {
    const user = await this.usersService.findOne(userConnectionId);
    const notification: any = {};
    notification.notificationMessage = `${user.username} is connected to you`;
    notification.userId = userId;
    notification.relatedUserId = userConnectionId;
    notification.createdAt = new Date();
    notification.read = false;
    notification.type = 'NEW_CONNECTION';
    await this.sendNotification(
      notification.notificationMessage,
      [userConnectionId.toString()],
      userConnectionId,
    );
    await this.notificationEntityMongoRepository.save(notification);
  }

  async createGiftNotification(userId, giftGiverId, gift) {
    const user = await this.usersService.findOne(userId);
    const notification: any = {};
    notification.notificationMessage = `${user.username} sent you a gift`;
    notification.userId = userId;
    notification.relatedUserId = giftGiverId;
    notification.createdAt = new Date();
    notification.read = false;
    notification.type = 'GIFT';
    await this.sendNotification(
      notification.notificationMessage,
      [userId.toString()],
      gift,
    );
    await this.notificationEntityMongoRepository.save(notification);
  }

  async createAdminRemovedPostNotification(userId) {
    const user = await this.usersService.findOne(userId);
    const notification: any = {};
    notification.notificationMessage = `Admin removed your post`;
    notification.userId = userId;
    notification.relatedUserId = userId;
    notification.createdAt = new Date();
    notification.read = false;
    notification.type = 'ADMIN_REMOVED_POST';
    await this.sendNotification(
      notification.notificationMessage,
      [userId.toString()],
      userId,
    );
    await this.notificationEntityMongoRepository.save(notification);
  }

  async createAdminRemovedCommentNotification(userId: ObjectID) {
    const user = await this.usersService.findOne(userId);
    const notification: any = {};
    notification.notificationMessage = `Admin removed your comment`;
    notification.userId = userId;
    notification.relatedUserId = userId;
    notification.createdAt = new Date();
    notification.read = false;
    notification.type = 'ADMIN_REMOVED_COMMENT';
    await this.sendNotification(
      notification.notificationMessage,
      [userId.toString()],
      userId,
    );
    await this.notificationEntityMongoRepository.save(notification);
  }

  async sendNotification(message, userIds, data: any) {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_external_user_ids = userIds;
    notification.contents = {
      en: message,
    };
    notification.data = {
      data,
    };
    await this.client.createNotification(notification);
  }
}
