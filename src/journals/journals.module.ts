import { Module } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { JournalsController } from './journals.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Journal} from "./entities/journal.entity";
import {UsersModule} from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([Journal]), UsersModule],
  controllers: [JournalsController],
  providers: [JournalsService]
})
export class JournalsModule {}
