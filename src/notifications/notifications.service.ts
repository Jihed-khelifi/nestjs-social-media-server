import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import * as OneSignal from '@onesignal/node-onesignal';
import { JournalsService } from '../journals/journals.service';
import { UsersService } from '../users/users.service';
import { ObjectId } from 'mongodb';

const ONESIGNAL_APP_ID = '92a64123-4fb9-4c5b-90eb-b789794f168d';
const app_key_provider = {
  getToken() {
    return 'Y2QwNzVjOWUtNWNjMC00OGFmLWJkYTQtZjlhOTkxM2E2MDM4';
  },
};

@Injectable()
export class NotificationsService {
  client: any;

  constructor(
    private journalsService: JournalsService,
    private usersService: UsersService,
    @InjectRepository(NotificationEntity)
    private notificationEntityMongoRepository: MongoRepository<NotificationEntity>,
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

  public async createCommentOnPostNotification(
    postId,
    userId,
    mentions: string[],
  ) {
    const posts = await this.journalsService.getPostsByCondition({
      _id: postId,
    });
    const post = posts[0];
    const user = await this.usersService.findOne(new ObjectId(userId));
    console.log(post);
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
      notification.type = 'MY_POST_COMMENT';
      await this.sendNotification(
        notification.notificationMessage,
        [post.createdBy.toString()],
        post,
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
        mentionNotification.type = 'MENTION_IN_COMMENT';
        await this.sendNotification(
          mentionNotification.notificationMessage,
          [mention.toString()],
          post,
        );
        await this.notificationEntityMongoRepository.save(mentionNotification);
      }
    }
  }

  async sendNotification(message, userIds, post) {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_external_user_ids = userIds;
    notification.contents = {
      en: message,
    };
    notification.data = {
      ...post,
    };
    await this.client.createNotification(notification);
  }
}
