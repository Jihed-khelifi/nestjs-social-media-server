import { Module, forwardRef } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { JournalsController } from './journals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journal } from './entities/journal.entity';
import { UsersModule } from '../users/users.module';
import { ReportModule } from '../report/report.module';
import { BlockedUsersEntity } from '../users/entities/blocked_user.entity';
import { ConnectionsModule } from 'src/connections/connections.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Journal, BlockedUsersEntity]),
    forwardRef(() => UsersModule),
    ReportModule,
    forwardRef(() => ConnectionsModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [JournalsController],
  providers: [JournalsService],
  exports: [JournalsService],
})
export class JournalsModule {}
