import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {MongoRepository} from "typeorm";
import {Emotion} from "./entities/emotion.entity";

@Injectable()
export class EmotionsService {
    constructor(@InjectRepository(Emotion) private emotionMongoRepository: MongoRepository<Emotion>) {}
    async findAll() {
      return this.emotionMongoRepository.find({});
    }
    async findByType(type) {
      return this.emotionMongoRepository.findBy({type});
    }
    async aggregateByType() {
      return this.emotionMongoRepository.aggregate( [
          { $group: {
                  _id: '$type',
                  emotions : { $addToSet: '$title' }
              }
          },
          { $project: { "_id": 0, type: '$_id', "emotions": 1 } }
      ]).toArray()
    }
}
