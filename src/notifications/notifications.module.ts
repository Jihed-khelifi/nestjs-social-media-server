import { forwardRef, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { JournalsModule } from '../journals/journals.module';
import { UsersModule } from '../users/users.module';
import { ConnectionsModule } from 'src/connections/connections.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    forwardRef(() => JournalsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => ConnectionsModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
