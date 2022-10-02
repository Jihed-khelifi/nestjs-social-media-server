import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import * as OneSignal from '@onesignal/node-onesignal';
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
  async sendNotification(message, userIds) {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_external_user_ids = userIds;
    notification.contents = {
      en: message,
    };
    await this.client.createNotification(notification);
  }
}
