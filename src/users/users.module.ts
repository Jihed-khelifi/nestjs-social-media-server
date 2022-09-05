import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EmailsModule } from '../emails/emails.module';
import {AuthModule} from "../auth/auth.module";
import {ThemesModule} from "../themes/themes.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]), EmailsModule, AuthModule, ThemesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
