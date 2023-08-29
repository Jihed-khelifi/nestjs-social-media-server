import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { EmailsModule } from './emails/emails.module';
import { EmotionsModule } from './emotions/emotions.module';
import { Emotion } from './emotions/entities/emotion.entity';
import { CategoryModule } from './categories/categories.module';
import { Category } from './categories/entities/category.entity';
import { JournalsModule } from './journals/journals.module';
import { Journal } from './journals/entities/journal.entity';
import { CommentsModule } from './comments/comments.module';
import { CommentEntity } from './comments/entities/comment.entity';
import { ThemesModule } from './themes/themes.module';
import { ThemeEntity } from './themes/entities/theme.entity';
import { UserThemeEntity } from './themes/entities/user_theme.entity';
import { DeleteUserEntity } from './users/entities/delete_user.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationEntity } from './notifications/entities/notification.entity';
import { ReportEntity } from './report/entities/report.entity';
import { ReportModule } from './report/report.module';
import { LinkedAccountUserEntity } from './users/entities/linked_account_user.entity';
import { BlockedUsersEntity } from './users/entities/blocked_user.entity';
import { ConnectionsModule } from './connections/connections.module';
import { ConnectionEntity } from './connections/entities/connections.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: process.env.MONGODB_CONNECTION_STRING,
      database: 'continuem',
      authSource: 'admin',
      entities: [
        User,
        Emotion,
        Category,
        Journal,
        CommentEntity,
        ThemeEntity,
        UserThemeEntity,
        DeleteUserEntity,
        NotificationEntity,
        ReportEntity,
        LinkedAccountUserEntity,
        BlockedUsersEntity,
        ConnectionEntity,
      ],
      ssl: false,
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }),
    CommentsModule,
    JournalsModule,
    EmotionsModule,
    CategoryModule,
    UsersModule,
    AuthModule,
    EmailsModule,
    ThemesModule,
    NotificationsModule,
    ReportModule,
    ScheduleModule.forRoot(),
    ConnectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
