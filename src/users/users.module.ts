import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EmailsModule } from '../emails/emails.module';
import { AuthModule } from '../auth/auth.module';
import { ThemesModule } from '../themes/themes.module';
import { DeleteUserEntity } from './entities/delete_user.entity';
import { LinkedAccountUserEntity } from './entities/linked_account_user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, DeleteUserEntity, LinkedAccountUserEntity]),
    EmailsModule,
    AuthModule,
    ThemesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
