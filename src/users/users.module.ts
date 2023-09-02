import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EmailsModule } from '../emails/emails.module';
import { AuthModule } from '../auth/auth.module';
import { ThemesModule } from '../themes/themes.module';
import { DeleteUserEntity } from './entities/delete_user.entity';
import { LinkedAccountUserEntity } from './entities/linked_account_user.entity';
import { BlockedUsersEntity } from './entities/blocked_user.entity';
import { ConnectionsModule } from 'src/connections/connections.module';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      DeleteUserEntity,
      LinkedAccountUserEntity,
      BlockedUsersEntity,
    ]),
    EmailsModule,
    AuthModule,
    ThemesModule,
    forwardRef(() => ConnectionsModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
