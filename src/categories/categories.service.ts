import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {MongoRepository} from "typeorm";
import {Category} from "./entities/category.entity";

@Injectable()
export class CategoryService {
    constructor(@InjectRepository(Category) private categoryMongoRepository: MongoRepository<Category>) {}
    async findAll() {
      return this.categoryMongoRepository.find({});
    }
    async findByType(type) {
      return this.categoryMongoRepository.findBy({type});
    }
    async aggregateByType() {
      return this.categoryMongoRepository.aggregate( [
          { $group: {
                  _id: '$type',
                  categories : { $addToSet: '$category' }
              }
          },
          { $project: { "_id": 0, type: '$_id', "categories": 1 } }
      ]).toArray()
    }
}
