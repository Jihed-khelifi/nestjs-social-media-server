import { Module } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionEntity } from './entities/connections.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionsService } from './connections.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([ConnectionEntity]), UsersModule],
  controllers: [ConnectionsController],
  providers: [ConnectionsService, UsersModule],
})
export class ConnectionsModule {}
