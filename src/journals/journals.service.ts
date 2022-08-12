import {HttpException, Injectable} from '@nestjs/common';
import {CreateJournalDto} from './dto/create-journal.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {MongoRepository} from "typeorm";
import {Journal} from "./entities/journal.entity";
import {User} from "../users/entities/user.entity";
import {ObjectId} from 'mongodb';
import {UpdateJournalDto} from "./dto/update-journal.dto";
import {UsersService} from "../users/users.service";

@Injectable()
export class JournalsService {
    constructor(@InjectRepository(Journal) private journalMongoRepository: MongoRepository<Journal>, private userService: UsersService) {
    }

    create(createJournalDto: CreateJournalDto) {
        return this.journalMongoRepository.save(createJournalDto);
    }

    update(updateJournalDto: UpdateJournalDto) {
        return this.journalMongoRepository.update(new ObjectId(updateJournalDto.id), {...updateJournalDto});
    }

    getMyPostsOfDate(user: User, date: string) {
        const startDate = new Date(date);
        return this.getPostsByCondition({
            createdBy: new ObjectId(user.id),
            createdAt: {"$gte": startDate, "$lt": new Date(startDate.getTime() + (60 * 60 * 24 * 1000))}
        })
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

    async getPostsByCondition(matchCondition) {
        const matchQuery = {
            $match: matchCondition
        };
        return this.journalMongoRepository.aggregate([
            {...matchQuery},
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
                $project: {
                    "user.password": 0,
                    "user.activationKey": 0,
                    "user.otp": 0,
                    "user.otpSentAt": 0,
                    "user.isActive": 0
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    pipeline: [
                        {
                            $match: {
                                commentId: null
                            }
                        },
                        {
                            $lookup: {
                                from: "comments",
                                localField: "_id",
                                foreignField: "commentId",
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: 'users',
                                            localField: 'userId',
                                            foreignField: '_id',
                                            pipeline: [
                                                {
                                                    $lookup: {
                                                        from: 'journals',
                                                        localField: '_id',
                                                        foreignField: 'createdBy',
                                                        pipeline: [
                                                            {$sort: {createdAt: -1}},
                                                            {
                                                                "$limit": 1
                                                            }
                                                        ],
                                                        as: 'last_journal'
                                                    }
                                                },
                                                {$unwind: '$last_journal'},
                                            ],
                                            as: 'user'
                                        }
                                    },
                                    {$unwind: '$user'},
                                    {
                                        $project: {
                                            "user.password": 0,
                                            "user.activationKey": 0,
                                            "user.isActive": 0,
                                            "user.otpSentAt": 0,
                                            "user.otp": 0,
                                        }
                                    }
                                ],
                                as: "replies"
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: 'journals',
                                            localField: '_id',
                                            foreignField: 'createdBy',
                                            pipeline: [
                                                {$sort: {createdAt: -1}},
                                                {
                                                    "$limit": 1
                                                }
                                            ],
                                            as: 'last_journal'
                                        }
                                    },
                                    {$unwind: '$last_journal'},
                                ],
                                as: 'user'
                            }
                        },
                        {$unwind: '$user'},
                        {
                            $project: {
                                "user.password": 0,
                                "user.activationKey": 0,
                                "user.otp": 0,
                                "user.otpSentAt": 0,
                                "user.isActive": 0
                            }
                        },
                        {$sort: {createdAt: -1}}
                    ],
                    as: 'comments'
                }
            },
        ]).toArray();
    }

    async minePosts(user: any) {
        const matchQuery = {
            $match: {},
        };
        matchQuery.$match = {
            createdBy: new ObjectId(user.id)
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
                $project: {
                    "user.password": 0,
                    "user.activationKey": 0,
                    "user.otp": 0,
                    "user.otpSentAt": 0,
                    "user.isActive": 0
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    pipeline: [
                        {
                            $match: {
                                commentId: null
                            }
                        },
                        {
                            $lookup: {
                                from: "comments",
                                localField: "_id",
                                foreignField: "commentId",
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: 'users',
                                            localField: 'userId',
                                            foreignField: '_id',
                                            pipeline: [
                                                {
                                                    $lookup: {
                                                        from: 'journals',
                                                        localField: '_id',
                                                        foreignField: 'createdBy',
                                                        pipeline: [
                                                            {$sort: {createdAt: -1}},
                                                            {
                                                                "$limit": 1
                                                            }
                                                        ],
                                                        as: 'last_journal'
                                                    }
                                                },
                                                {$unwind: '$last_journal'},
                                            ],
                                            as: 'user'
                                        }
                                    },
                                    {$unwind: '$user'},
                                    {
                                        $project: {
                                            "user.password": 0,
                                            "user.activationKey": 0,
                                            "user.isActive": 0,
                                            "user.otpSentAt": 0,
                                            "user.otp": 0,
                                        }
                                    }
                                ],
                                as: "replies"
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: 'journals',
                                            localField: '_id',
                                            foreignField: 'createdBy',
                                            pipeline: [
                                                {$sort: {createdAt: -1}},
                                                {
                                                    "$limit": 1
                                                }
                                            ],
                                            as: 'last_journal'
                                        }
                                    },
                                    {$unwind: '$last_journal'},
                                ],
                                as: 'user'
                            }
                        },
                        {$unwind: '$user'},
                        {
                            $project: {
                                "user.password": 0,
                                "user.activationKey": 0,
                                "user.otp": 0,
                                "user.otpSentAt": 0,
                                "user.isActive": 0
                            }
                        },
                        {$sort: {createdAt: -1}}
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
            {$sort: {date: -1}}
        ]).toArray()
    }

    async getCommunityPosts(user: any, type: string, page: number) {
        await this.userService.updateUser(new ObjectId(user.id), {isOnline: true});
        const matchQuery = {
            $match: {},
        };
        if (type === 'country') {
            if (!user.country) {
                return [];
            }
            const countryUsers = await this.userService.findByCountry(user.country);
            matchQuery.$match = {
                type: 'public',
                createdBy: {
                    $in: countryUsers.map(p => new ObjectId(p.id))
                }
            };
        } else if (type === 'local') {
            const nearByActiveUsers = await this.userService.getNearbyActiveUsers(user);
            matchQuery.$match = {
                type: 'public',
                createdBy: {
                    $in: nearByActiveUsers.map(p => new ObjectId(p.id))
                }
            };
        } else {
            matchQuery.$match = {
                type: 'public',
            }
        }
        return this.journalMongoRepository.aggregate([
            {...matchQuery},
            {
                $project: {
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
                $project: {
                    "user.password": 0,
                    "user.activationKey": 0,
                    "user.otp": 0,
                    "user.otpSentAt": 0,
                    "user.location": 0,
                    "user.isActive": 0,
                    "user.country": 0,
                    "user.state": 0,
                    "user.city": 0,
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    pipeline: [
                        {
                            $match: {
                                commentId: null
                            }
                        },
                        {
                            $lookup: {
                                from: "comments",
                                localField: "_id",
                                foreignField: "commentId",
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: 'users',
                                            localField: 'userId',
                                            foreignField: '_id',
                                            pipeline: [
                                                {
                                                    $lookup: {
                                                        from: 'journals',
                                                        localField: '_id',
                                                        foreignField: 'createdBy',
                                                        pipeline: [
                                                            {$sort: {createdAt: -1}},
                                                            {
                                                                "$limit": 1
                                                            }
                                                        ],
                                                        as: 'last_journal'
                                                    }
                                                },
                                                {$unwind: '$last_journal'},
                                            ],
                                            as: 'user'
                                        }
                                    },
                                    {$unwind: '$user'},
                                    {
                                        $project: {
                                            "user.password": 0,
                                            "user.activationKey": 0,
                                            "user.otp": 0,
                                            "user.otpSentAt": 0,
                                            "user.location": 0,
                                            "user.isActive": 0,
                                            "user.country": 0,
                                            "user.state": 0,
                                            "user.city": 0,
                                        }
                                    }
                                ],
                                as: "replies"
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: 'journals',
                                            localField: '_id',
                                            foreignField: 'createdBy',
                                            pipeline: [
                                                {$sort: {createdAt: -1}},
                                                {
                                                    "$limit": 1
                                                }
                                            ],
                                            as: 'last_journal'
                                        }
                                    },
                                    {$unwind: '$last_journal'},
                                ],
                                as: 'user'
                            }
                        },
                        {$unwind: '$user'},
                        {
                            $project: {
                                "user.password": 0,
                                "user.activationKey": 0,
                                "user.otp": 0,
                                "user.otpSentAt": 0,
                                "user.isActive": 0
                            }
                        },
                        {$sort: {createdAt: -1}}
                    ],
                    as: 'comments'
                }
            },
            {$sort: {createdAt: -1}},
            {
                $facet: {
                    pageDetails: [{$count: "total"}, {$addFields: {page: page}}],
                    journals: [{$skip: page * 10}, {$limit: 10}]
                }
            },
            {
                $unwind: '$pageDetails'
            }
        ]).toArray()
    }

    async getMinutesOfEmotions(user: any, month: number) {
        const data = await this.journalMongoRepository.aggregate([
            {
                $match: {
                    createdBy: new ObjectId(user.id)
                }
            },
            {
                $project: {
                    month: { "$month": "$createdAt" },
                    date: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    _id: 1,
                    emotions: 1,
                    createdAt: 1,
                }
            },
            {$match: { "month": +month }},
            {$sort: {createdAt: -1}},
            {$group: {_id: '$date', data: {$push: '$$ROOT'}}},
            {$project: {documentAndNextPostTime: {$zip: {inputs: ['$data', {$concatArrays: [[null], '$data.createdAt']}]}}}},
            {$unwind: {path: '$documentAndNextPostTime'}},
            {$replaceWith: {$mergeObjects: [{$arrayElemAt: ['$documentAndNextPostTime', 0]}, {nextPostTime: {$arrayElemAt: ['$documentAndNextPostTime', 1]}}]}},
            {
                $set: {
                    time_difference: {
                        $dateDiff:
                            {
                                startDate: "$createdAt",
                                endDate: "$nextPostTime",
                                unit: "minute"
                            }
                    }
                }
            },
            {$unset: 'nextPostTime'},
            {$set: {emotion: {$arrayElemAt: ['$emotions.type', 0]}}},
            {
                $set: {
                    nextDate: {
                        $add: [{
                            $dateFromString: {
                                dateString: "$date"
                            }
                        }, 24 * 60 * 60000]
                    }
                }
            },
            {
                $set: {
                    time_difference: { $ifNull: [ "$time_difference", {
                            $dateDiff:
                                {
                                    startDate: "$createdAt",
                                    endDate: "$nextDate",
                                    unit: "minute"
                                }
                        } ] }
                }
            },
            {$unset: ['emotions', 'nextDate']},
            {$group: {_id: '$date', data: {$push: '$$ROOT'}}},
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    data: 1,
                }
            },
            {$unset: ['data.date', 'data._id', 'data.month', 'data.createdAt']},
        ]).toArray();
        const finalData = {};
        for (const outerData of data) {
            const groupByEmotion = outerData.data.reduce((group, d) => {
                const { emotion } = d;
                group[emotion] = group[emotion] ?? [];
                group[emotion].push(d);
                return group;
            }, {});
            if (groupByEmotion.negative) {
                groupByEmotion.negative = groupByEmotion.negative.reduce((accumulator, object) => {
                    return accumulator + object.time_difference;
                }, 0);
            }
            if (groupByEmotion.positive) {
                groupByEmotion.positive = groupByEmotion.positive.reduce((accumulator, object) => {
                    return accumulator + object.time_difference;
                }, 0);
            }
            if (groupByEmotion.natural) {
                groupByEmotion.natural = groupByEmotion.natural.reduce((accumulator, object) => {
                    return accumulator + object.time_difference;
                }, 0);
            }
            const totalSum = Object.keys(groupByEmotion).reduce((prev, key) => {
                return prev + groupByEmotion[key];
            }, 0);
            finalData[outerData.date] = Object.keys(groupByEmotion).reduce((prev, key) => {
                return {...prev, [key]: Math.round((groupByEmotion[key]/totalSum) * 100) }
            }, {});
        }
        return finalData;
    }
}
