import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { EmailsModule } from './emails/emails.module';
import { EmotionsModule } from './emotions/emotions.module';
import {Emotion} from "./emotions/entities/emotion.entity";
import {CategoryModule} from "./categories/categories.module";
import {Category} from "./categories/entities/category.entity";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: process.env.MONGODB_CONNECTION_STRING,
      database: 'continuem',
      entities: [User, Emotion, Category],
      ssl: true,
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }),
    EmotionsModule,
    CategoryModule,
    UsersModule,
    AuthModule,
    EmailsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
