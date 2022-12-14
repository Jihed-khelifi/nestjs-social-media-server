import { forwardRef, Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportEntity } from './entities/report.entity';
import { UsersModule } from '../users/users.module';
import { JournalsModule } from '../journals/journals.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportEntity]),
    UsersModule,
    forwardRef(() => CommentsModule),
    forwardRef(() => JournalsModule),
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
