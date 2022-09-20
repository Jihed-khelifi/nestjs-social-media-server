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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
