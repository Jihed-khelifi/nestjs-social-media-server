import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Emotion } from './entities/emotion.entity';

@Injectable()
export class EmotionsService {
  constructor(
    @InjectRepository(Emotion)
    private emotionMongoRepository: MongoRepository<Emotion>,
  ) {}
  async findAll() {
    return this.emotionMongoRepository.find({});
  }
  async findByType(type) {
    return this.emotionMongoRepository.findBy({ type });
  }
  async aggregateByType() {
    return this.emotionMongoRepository
      .aggregate([
        {
          $group: {
            _id: '$category',
            data: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            'data.type': 1,
            'data.title': 1,
            'data.category': 1,
            'data.description': 1,
            'data.definition': 1,
          },
        },
      ])
      .toArray();
  }
}
