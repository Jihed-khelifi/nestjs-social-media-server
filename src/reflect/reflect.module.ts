import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReflectController } from './reflect.controller';
import { ReflectService } from './reflect.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [ReflectController],
  providers: [ReflectService],
})
export class ReflectModule {}
