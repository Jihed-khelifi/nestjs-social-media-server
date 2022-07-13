import {Injectable} from '@nestjs/common';
import {CreateEmotionDto} from './dto/create-emotion.dto';
import {UpdateEmotionDto} from './dto/update-emotion.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {MongoRepository} from "typeorm";
import {Emotion} from "./entities/emotion.entity";

@Injectable()
export class EmotionsService {
    constructor(@InjectRepository(Emotion)
                private emotionMongoRepository: MongoRepository<Emotion>,) {
    }

    create(createEmotionDto: CreateEmotionDto) {
        return 'This action adds a new emotion';
    }

    async findAll() {
      return await this.emotionMongoRepository.find({});
    }

    async findByType(type) {
      return await this.emotionMongoRepository.findBy({type});
    }

    findOne(id: number) {
        return `This action returns a #${id} emotion`;
    }

    update(id: number, updateEmotionDto: UpdateEmotionDto) {
        return `This action updates a #${id} emotion`;
    }

    remove(id: number) {
        return `This action removes a #${id} emotion`;
    }
}
