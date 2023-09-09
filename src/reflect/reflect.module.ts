import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReflectController } from './reflect.controller';
import { ReflectService } from './reflect.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigEntity } from '../config.entity';

@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forFeature([ConfigEntity])],
  controllers: [ReflectController],
  providers: [ReflectService],
})
export class ReflectModule {}
