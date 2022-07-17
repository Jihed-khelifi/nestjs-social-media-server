import {Injectable} from '@nestjs/common';
import {CreateJournalDto} from './dto/create-journal.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {MongoRepository} from "typeorm";
import {Journal} from "./entities/journal.entity";
import {User} from "../users/entities/user.entity";
import {ObjectId} from 'mongodb';

@Injectable()
export class JournalsService {
    constructor(@InjectRepository(Journal) private journalMongoRepository: MongoRepository<Journal>) {
    }

    create(createJournalDto: CreateJournalDto) {
        return this.journalMongoRepository.save(createJournalDto);
    }

    findAll(user: User) {
        return this.journalMongoRepository.findBy({createdBy: new ObjectId(user.id)});
    }

    async aggregateByDate(user?: any) {
        const matchQuery = {
            $match: {},
        };
        if (user) {
            matchQuery.$match = {
                createdBy: new ObjectId(user.id)
            }
        } else {
            matchQuery.$match = {
                type: 'public',
            }
        }
        return this.journalMongoRepository.aggregate([
            {...matchQuery},
            {
                $project: {
                    date: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    emotions: 1,
                    category: 1,
                    description: 1,
                    type: 1,
                    createdBy: 1,
                    createdAt: 1,
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {$unwind: '$user'},
            {
                $group: {
                    _id: '$date',
                    journals: {
                        $addToSet: {
                            emotions: "$emotions",
                            id: "$_id",
                            description: "$description",
                            type: "$type",
                            category: "$category",
                            createdBy: "$createdBy",
                            user: "$user",
                            createdAt: "$createdAt"
                        }
                    },
                }
            },
            {$project: {"_id": 0, "journals": 1, date: '$_id'}},
            { $sort : { date : -1 } }
        ]).toArray()
    }
}
