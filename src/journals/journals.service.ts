import { Injectable } from '@nestjs/common';
import { CreateJournalDto } from './dto/create-journal.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {MongoRepository} from "typeorm";
import {Journal} from "./entities/journal.entity";
import {User} from "../users/entities/user.entity";
import { ObjectId } from 'mongodb';

@Injectable()
export class JournalsService {
  constructor(@InjectRepository(Journal) private journalMongoRepository: MongoRepository<Journal>) {}
  create(createJournalDto: CreateJournalDto) {
    return this.journalMongoRepository.save(createJournalDto);
  }

  findAll(user: User) {
    return this.journalMongoRepository.findBy({createdBy: new ObjectId(user.id)});
  }
}
