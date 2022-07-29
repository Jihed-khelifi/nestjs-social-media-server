import {HttpException, Injectable} from '@nestjs/common';
import {CreateJournalDto} from './dto/create-journal.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {MongoRepository} from "typeorm";
import {Journal} from "./entities/journal.entity";
import {User} from "../users/entities/user.entity";
import {ObjectId} from 'mongodb';
import {UpdateJournalDto} from "./dto/update-journal.dto";

@Injectable()
export class JournalsService {
    constructor(@InjectRepository(Journal) private journalMongoRepository: MongoRepository<Journal>) {
    }

    create(createJournalDto: CreateJournalDto) {
        return this.journalMongoRepository.save(createJournalDto);
    }

    update(updateJournalDto: UpdateJournalDto) {
        return this.journalMongoRepository.update(new ObjectId(updateJournalDto.id), {...updateJournalDto});
    }

    findAll(user: User) {
        return this.journalMongoRepository.findBy({createdBy: new ObjectId(user.id)});
    }
    countPublicPosts(user: User) {
        return this.journalMongoRepository.count({createdBy: new ObjectId(user.id), type: 'public'});
    }
    async delete(id, user: User) {
        const journal = await this.journalMongoRepository.findOne(id);
        if (journal) {
            await this.journalMongoRepository.delete({id: new ObjectId(id)});
        } else {
            throw new HttpException('Not found', 404);
        }
        return journal;
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
            {$project: {"user.password": 0, "user.activationKey": 0, "user.otp": 0, "user.otpSentAt": 0, "user.isActive": 0}},
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    pipeline: [
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                as: 'user'
                            }
                        },
                        {$unwind: '$user'},
                        {$project: {"user.password": 0, "user.activationKey": 0, "user.otp": 0, "user.otpSentAt": 0, "user.isActive": 0}},
                        { $sort : { createdAt : -1 } }
                    ],
                    as: 'comments'
                }
            },
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
                            comments: "$comments",
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
