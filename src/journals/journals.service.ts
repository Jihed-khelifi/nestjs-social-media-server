import { HttpException, Injectable, Inject, forwardRef } from '@nestjs/common';
import { CreateJournalDto } from './dto/create-journal.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, Not } from 'typeorm';
import { Journal } from './entities/journal.entity';
import { User } from '../users/entities/user.entity';
import { ObjectId } from 'mongodb';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { UsersService } from '../users/users.service';
import { ReportService } from '../report/report.service';
import { BlockedUsersEntity } from '../users/entities/blocked_user.entity';
import { ConnectionsService } from 'src/connections/connections.service';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

@Injectable()
export class JournalsService {
  constructor(
    @InjectRepository(Journal)
    private journalMongoRepository: MongoRepository<Journal>,
    @InjectRepository(BlockedUsersEntity)
    private blockedUsersEntityMongoRepository: MongoRepository<BlockedUsersEntity>,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
    private reportService: ReportService,
    @Inject(forwardRef(() => ConnectionsService))
    private connectionsService: ConnectionsService,
  ) {}

  create(createJournalDto: CreateJournalDto) {
    return this.journalMongoRepository.save(createJournalDto);
  }

  update(updateJournalDto: UpdateJournalDto) {
    return this.journalMongoRepository.update(
      new ObjectId(updateJournalDto.id),
      { ...updateJournalDto },
    );
  }

  getMyPostsOfDate(user: User, date: string) {
    const startDate = new Date(date);
    return this.getPostsByCondition(null, {
      createdBy: new ObjectId(user.id),
      createdAt: {
        $gte: startDate,
        $lt: new Date(startDate.getTime() + 60 * 60 * 24 * 1000),
      },
    });
  }

  countPublicPosts(user: User) {
    return this.journalMongoRepository.count({
      createdBy: new ObjectId(user.id),
      type: 'public',
    });
  }

  getPostById(id) {
    return this.journalMongoRepository.findOneById(id);
  }

  async delete(id, user: User) {
    const journal = await this.journalMongoRepository.findOne(new ObjectId(id));
    if (journal) {
      await this.journalMongoRepository.update(
        { id: new ObjectId(id) },
        { status: 'deleted' },
      );
      await this.reportService.markStatus(id, 'deleted');
    } else {
      throw new HttpException('Not found', 404);
    }
    return journal;
  }

  async removePostByAdmin(id) {
    const journal = await this.journalMongoRepository.findOne(new ObjectId(id));
    if (journal) {
      await this.journalMongoRepository.update(
        { id: new ObjectId(id) },
        { status: 'removed' },
      );
      await this.reportService.markStatus(id, 'removed');
    } else {
      throw new HttpException('Not found', 404);
    }
    return journal;
  }

  async getPostsByCondition(user, matchCondition) {
    const matchQuery = {
      $match: matchCondition,
    };
    const blockedUsers = [];
    if (user) {
      const blocked = await this.blockedUsersEntityMongoRepository.findBy({
        $or: [{ blockedBy: user.id }, { blockedTo: user.id }],
      });
      for (const u of blocked) {
        if (u.blockedBy.toString() !== user.id.toString()) {
          blockedUsers.push(u.blockedBy);
        } else {
          blockedUsers.push(u.blockedTo);
        }
      }
    }
    const bannedUsers = await this.userService.getBannedUsers();
    return this.journalMongoRepository
      .aggregate([
        { ...matchQuery },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            'user.password': 0,
            'user.activationKey': 0,
            'user.otp': 0,
            'user.otpSentAt': 0,
            'user.isActive': 0,
          },
        },
        { $addFields: { currentDate: '$$NOW' } },
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'postId',
            pipeline: [
              {
                $match: {
                  commentId: null,
                  userId: {
                    $nin: [...blockedUsers, ...bannedUsers.map((u) => u.id)],
                  },
                },
              },
              {
                $lookup: {
                  from: 'comments',
                  localField: '_id',
                  foreignField: 'commentId',
                  pipeline: [
                    {
                      $match: {
                        userId: {
                          $nin: [
                            ...blockedUsers,
                            ...bannedUsers.map((u) => u.id),
                          ],
                        },
                      },
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
                                { $sort: { createdAt: -1 } },
                                {
                                  $limit: 1,
                                },
                              ],
                              as: 'last_journal',
                            },
                          },
                          { $unwind: '$last_journal' },
                        ],
                        as: 'user',
                      },
                    },
                    { $unwind: '$user' },
                    {
                      $project: {
                        'user.password': 0,
                        'user.activationKey': 0,
                        'user.isActive': 0,
                        'user.otpSentAt': 0,
                        'user.otp': 0,
                      },
                    },
                  ],
                  as: 'replies',
                },
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
                          { $sort: { createdAt: -1 } },
                          {
                            $limit: 1,
                          },
                        ],
                        as: 'last_journal',
                      },
                    },
                    { $unwind: '$last_journal' },
                  ],
                  as: 'user',
                },
              },
              { $unwind: '$user' },
              {
                $project: {
                  'user.password': 0,
                  'user.activationKey': 0,
                  'user.otp': 0,
                  'user.otpSentAt': 0,
                  'user.isActive': 0,
                },
              },
              { $sort: { createdAt: -1 } },
            ],
            as: 'comments',
          },
        },
      ])
      .toArray();
  }

  async minePosts(user: any) {
    const matchQuery = {
      $match: {},
    };
    matchQuery.$match = {
      createdBy: new ObjectId(user.id),
      status: { $nin: ['deleted', 'removed'] },
    };
    return this.journalMongoRepository
      .aggregate([
        { ...matchQuery },
        {
          $project: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            emotions: 1,
            category: 1,
            description: 1,
            type: 1,
            createdBy: 1,
            createdAt: 1,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            'user.password': 0,
            'user.activationKey': 0,
            'user.otp': 0,
            'user.otpSentAt': 0,
            'user.isActive': 0,
          },
        },
        { $addFields: { currentDate: '$$NOW' } },
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'postId',
            pipeline: [
              {
                $match: {
                  commentId: null,
                },
              },
              {
                $lookup: {
                  from: 'comments',
                  localField: '_id',
                  foreignField: 'commentId',
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
                                { $sort: { createdAt: -1 } },
                                {
                                  $limit: 1,
                                },
                              ],
                              as: 'last_journal',
                            },
                          },
                          { $unwind: '$last_journal' },
                        ],
                        as: 'user',
                      },
                    },
                    { $unwind: '$user' },
                    {
                      $project: {
                        'user.password': 0,
                        'user.activationKey': 0,
                        'user.isActive': 0,
                        'user.otpSentAt': 0,
                        'user.otp': 0,
                      },
                    },
                  ],
                  as: 'replies',
                },
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
                          { $sort: { createdAt: -1 } },
                          {
                            $limit: 1,
                          },
                        ],
                        as: 'last_journal',
                      },
                    },
                    { $unwind: '$last_journal' },
                  ],
                  as: 'user',
                },
              },
              { $unwind: '$user' },
              {
                $project: {
                  'user.password': 0,
                  'user.activationKey': 0,
                  'user.otp': 0,
                  'user.otpSentAt': 0,
                  'user.isActive': 0,
                },
              },
              { $sort: { createdAt: -1 } },
            ],
            as: 'comments',
          },
        },
        {
          $group: {
            _id: '$date',
            journals: {
              $addToSet: {
                emotions: '$emotions',
                id: '$_id',
                description: '$description',
                type: '$type',
                category: '$category',
                createdBy: '$createdBy',
                user: '$user',
                comments: '$comments',
                createdAt: '$createdAt',
                currentDate: '$currentDate',
              },
            },
          },
        },
        { $project: { _id: 0, journals: 1, date: '$_id' } },
        { $sort: { date: -1 } },
      ])
      .toArray();
  }

  async getCommunityPosts(user: any, type: string, page: number) {
    if (user.id) {
      await this.userService.updateUser(new ObjectId(user.id), {
        isOnline: true,
      });
    }
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
          $in: countryUsers.map((p) => new ObjectId(p.id)),
        },
        status: { $nin: ['deleted', 'removed'] },
      };
    } else if (type === 'local') {
      const nearByActiveUsers = await this.userService.getNearbyActiveUsers(
        user,
      );
      matchQuery.$match = {
        type: 'public',
        createdBy: {
          $in: nearByActiveUsers.map((p) => new ObjectId(p.id)),
        },
        status: { $nin: ['deleted', 'removed'] },
      };
    } else if (type === 'followers') {
      const followersIds = await this.connectionsService.getFollowersIds(user);
      matchQuery.$match = {
        type: 'public',
        createdBy: {
          $in: followersIds,
        },
        status: { $nin: ['deleted', 'removed'] },
      };
    } else if (type === 'following') {
      const followingIds = await this.connectionsService.getFollowingsIds(user);
      matchQuery.$match = {
        type: 'public',
        createdBy: {
          $in: followingIds,
        },
        status: { $nin: ['deleted', 'removed'] },
      };
    } else if (type === 'connected') {
      const connectionsIds = await this.connectionsService.getConnectionsIds(
        user,
      );
      matchQuery.$match = {
        type: 'public',
        createdBy: {
          $in: connectionsIds,
        },
        status: { $nin: ['deleted', 'removed'] },
      };
    } else {
      matchQuery.$match = {
        type: 'public',
        status: { $nin: ['deleted', 'removed'] },
      };
    }
    const blockedUsers = [];
    if (user.id) {
      const blocked = await this.blockedUsersEntityMongoRepository.findBy({
        $or: [{ blockedBy: user.id }, { blockedTo: user.id }],
      });
      for (const u of blocked) {
        if (u.blockedBy.toString() !== user.id.toString()) {
          blockedUsers.push(u.blockedBy);
        } else {
          blockedUsers.push(u.blockedTo);
        }
      }
      const removeBlockedDataQuery = {
        createdBy: { $nin: blockedUsers },
      };
      matchQuery.$match = {
        ...matchQuery.$match,
        ...removeBlockedDataQuery,
      };
    }
    const bannedUsers = await this.userService.getBannedUsers();
    if (bannedUsers.length) {
      const removeBannedDataQuery = {
        createdBy: { $nin: bannedUsers.map((u) => u.id) },
      };
      if (
        matchQuery.$match['createdBy'] &&
        matchQuery.$match['createdBy']['$nin']
      ) {
        matchQuery.$match['createdBy']['$nin'] = [
          ...matchQuery.$match['createdBy']['$nin'],
          ...bannedUsers.map((u) => u.id),
        ];
      } else {
        matchQuery.$match = {
          ...matchQuery.$match,
          ...removeBannedDataQuery,
        };
      }
    }
    return this.journalMongoRepository
      .aggregate([
        { ...matchQuery },
        {
          $project: {
            emotions: 1,
            category: 1,
            description: 1,
            type: 1,
            createdBy: 1,
            createdAt: 1,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            'user.password': 0,
            'user.activationKey': 0,
            'user.otp': 0,
            'user.otpSentAt': 0,
            'user.location': 0,
            'user.isActive': 0,
            'user.country': 0,
            'user.state': 0,
            'user.city': 0,
          },
        },
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'postId',
            pipeline: [
              {
                $match: {
                  commentId: null,
                  userId: {
                    $nin: [...blockedUsers, ...bannedUsers.map((u) => u.id)],
                  },
                },
              },
              {
                $lookup: {
                  from: 'comments',
                  localField: '_id',
                  foreignField: 'commentId',
                  pipeline: [
                    {
                      $match: {
                        userId: {
                          $nin: [
                            ...blockedUsers,
                            ...bannedUsers.map((u) => u.id),
                          ],
                        },
                      },
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
                                { $sort: { createdAt: -1 } },
                                {
                                  $limit: 1,
                                },
                              ],
                              as: 'last_journal',
                            },
                          },
                          { $unwind: '$last_journal' },
                        ],
                        as: 'user',
                      },
                    },
                    { $unwind: '$user' },
                    {
                      $project: {
                        'user.password': 0,
                        'user.activationKey': 0,
                        'user.otp': 0,
                        'user.otpSentAt': 0,
                        'user.location': 0,
                        'user.isActive': 0,
                        'user.country': 0,
                        'user.state': 0,
                        'user.city': 0,
                      },
                    },
                  ],
                  as: 'replies',
                },
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
                          { $sort: { createdAt: -1 } },
                          {
                            $limit: 1,
                          },
                        ],
                        as: 'last_journal',
                      },
                    },
                    { $unwind: '$last_journal' },
                  ],
                  as: 'user',
                },
              },
              { $unwind: '$user' },
              {
                $project: {
                  'user.password': 0,
                  'user.activationKey': 0,
                  'user.otp': 0,
                  'user.otpSentAt': 0,
                  'user.isActive': 0,
                },
              },
              { $sort: { createdAt: -1 } },
            ],
            as: 'comments',
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            pageDetails: [{ $count: 'total' }, { $addFields: { page: page } }],
            journals: [{ $skip: page * 10 }, { $limit: 10 }],
          },
        },
        {
          $unwind: '$pageDetails',
        },
      ])
      .toArray();
  }

  async getMinutesOfEmotions(user: any, matchCondition) {
    const finalData = {};
    const data = await this.insightAggregation(user, matchCondition);
    for (const outerData of data) {
      const groupByEmotion = outerData.data.reduce((group, d) => {
        const { emotion } = d;
        group[emotion] = group[emotion] ?? [];
        group[emotion].push(d);
        return group;
      }, {});
      for (const key of Object.keys(groupByEmotion)) {
        groupByEmotion[key] = groupByEmotion[key].reduce(
          (accumulator, object) => {
            if (object.time_difference > 120) {
              object.time_difference = 120;
            }
            return accumulator + object.time_difference;
          },
          0,
        );
      }
      const totalSum = Object.keys(groupByEmotion).reduce((prev, key) => {
        return prev + groupByEmotion[key];
      }, 0);
      finalData[outerData.date] = Object.keys(groupByEmotion).reduce(
        (prev, key) => {
          return {
            ...prev,
            [key]: Math.round((groupByEmotion[key] / totalSum) * 100),
          };
        },
        {},
      );
    }
    return finalData;
  }

  async getInsightsData(user: any, startDate: string, endDate: string) {
    const endD = new Date(endDate);
    const finalData: any = {};
    let data = await this.insightAggregation(user, {
      createdAt: {
        $gte: new Date(startDate),
        $lt: new Date(endD.getTime() + 60 * 60 * 24 * 1000),
      },
    });
    data = data.map((d) => d.data).flat();
    const negativeData = [...data].filter((d) => d.emotion === 'negative');
    const positiveData = [...data].filter((d) => d.emotion === 'positive');
    const groupByEmotion = data.reduce((group, d) => {
      const { emotion } = d;
      group[emotion] = group[emotion] ?? [];
      group[emotion].push(d);
      return group;
    }, {});
    const topEmotionGroup = { ...groupByEmotion };
    for (const key of Object.keys(groupByEmotion)) {
      groupByEmotion[key] = groupByEmotion[key].reduce(
        (accumulator, object) => {
          if (object.time_difference > 120) {
            object.time_difference = 120;
          }
          return accumulator + object.time_difference;
        },
        0,
      );
    }
    const totalSum = Object.keys(groupByEmotion).reduce((prev, key) => {
      return prev + groupByEmotion[key];
    }, 0);
    const totalSumNegative = negativeData.reduce((accumulator, object) => {
      if (object.time_difference > 120) {
        object.time_difference = 120;
      }
      return accumulator + object.time_difference;
    }, 0);
    const totalSumPositive = positiveData.reduce((accumulator, object) => {
      if (object.time_difference > 120) {
        object.time_difference = 120;
      }
      return accumulator + object.time_difference;
    }, 0);
    finalData.moodDistribution = Object.keys(groupByEmotion).reduce(
      (prev, key) => {
        return {
          ...prev,
          [key]: Math.round((groupByEmotion[key] / totalSum) * 100),
        };
      },
      {},
    );
    finalData.topEmotions = [];
    finalData.causesOfNegativity = [];
    finalData.causesOfPositivity = [];
    for (const key of Object.keys(topEmotionGroup)) {
      for (const emotionData of topEmotionGroup[key]) {
        if (emotionData.time_difference > 120) {
          emotionData.time_difference = 120;
        }
        const percent = Math.round(
          (emotionData.time_difference / totalSum) * 100,
        );
        if (percent < 1) {
          continue;
        }
        for (const emotion of emotionData.emotions.map((e) => e.title)) {
          const filtered = finalData.topEmotions.findIndex(
            (e) => e.title === emotion,
          );
          if (filtered !== -1) {
            finalData.topEmotions[filtered] = {
              ...finalData.topEmotions[filtered],
              percent: finalData.topEmotions[filtered].percent + percent,
            };
            continue;
          }
          finalData.topEmotions.push({
            title: emotion,
            percent,
            type: emotionData.emotion,
            createdAt: emotionData.createdAt,
          });
        }
      }
    }
    for (const catData of negativeData) {
      const percent = Math.round(
        (catData.time_difference / totalSumNegative) * 100,
      );
      if (percent < 1) {
        continue;
      }
      const filtered = finalData.causesOfNegativity.findIndex(
        (e) => e.title === catData.category,
      );
      if (filtered !== -1) {
        finalData.causesOfNegativity[filtered] = {
          ...finalData.causesOfNegativity[filtered],
          percent: finalData.causesOfNegativity[filtered].percent + percent,
        };
        continue;
      }
      finalData.causesOfNegativity.push({
        title: catData.category,
        type: catData.emotion,
        createdAt: catData.createdAt,
        percent,
      });
    }
    for (const catData of positiveData) {
      const percent = Math.round(
        (catData.time_difference / totalSumPositive) * 100,
      );
      if (percent < 1) {
        continue;
      }
      const filtered = finalData.causesOfPositivity.findIndex(
        (e) => e.title === catData.category,
      );
      if (filtered !== -1) {
        finalData.causesOfPositivity[filtered] = {
          ...finalData.causesOfPositivity[filtered],
          percent: finalData.causesOfPositivity[filtered].percent + percent,
        };
        continue;
      }
      finalData.causesOfPositivity.push({
        title: catData.category,
        type: catData.emotion,
        createdAt: catData.createdAt,
        percent,
      });
    }
    finalData.topEmotions = finalData.topEmotions.sort(
      (a, b) => b.percent - a.percent,
    );
    finalData.causesOfNegativity = finalData.causesOfNegativity.sort(
      (a, b) => b.percent - a.percent,
    );
    finalData.causesOfPositivity = finalData.causesOfPositivity.sort(
      (a, b) => b.percent - a.percent,
    );
    return finalData;
  }

  async insightAggregation(user, matchCondition) {
    return await this.journalMongoRepository
      .aggregate([
        {
          $match: {
            createdBy: new ObjectId(user.id),
          },
        },
        {
          $project: {
            month: { $month: '$createdAt' },
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            _id: 1,
            emotions: 1,
            category: 1,
            createdAt: 1,
          },
        },
        { $match: matchCondition },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
        {
          $project: {
            documentAndNextPostTime: {
              $zip: {
                inputs: [
                  '$data',
                  { $concatArrays: [[null], '$data.createdAt'] },
                ],
              },
            },
          },
        },
        { $unwind: { path: '$documentAndNextPostTime' } },
        {
          $replaceWith: {
            $mergeObjects: [
              { $arrayElemAt: ['$documentAndNextPostTime', 0] },
              {
                nextPostTime: { $arrayElemAt: ['$documentAndNextPostTime', 1] },
              },
            ],
          },
        },
        {
          $set: {
            time_difference: {
              $dateDiff: {
                startDate: '$createdAt',
                endDate: '$nextPostTime',
                unit: 'minute',
              },
            },
          },
        },
        { $unset: 'nextPostTime' },
        { $set: { emotion: { $arrayElemAt: ['$emotions.type', 0] } } },
        {
          $set: {
            nextDate: {
              $add: [
                {
                  $dateFromString: {
                    dateString: '$date',
                  },
                },
                24 * 60 * 60000,
              ],
            },
          },
        },
        {
          $set: {
            time_difference: {
              $ifNull: [
                '$time_difference',
                {
                  $dateDiff: {
                    startDate: '$createdAt',
                    endDate: '$nextDate',
                    unit: 'minute',
                  },
                },
              ],
            },
          },
        },
        { $unset: ['nextDate'] },
        { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            data: 1,
          },
        },
        { $unset: ['data.date', 'data._id', 'data.month'] },
      ])
      .toArray();
  }

  async moodDistributionAggregationGroupByMonth(user) {
    const aggregateData = await this.journalMongoRepository
      .aggregate([
        {
          $match: {
            createdBy: new ObjectId(user.id),
          },
        },
        {
          $project: {
            month: { $month: '$createdAt' },
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            _id: 1,
            emotions: 1,
            category: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
        {
          $project: {
            documentAndNextPostTime: {
              $zip: {
                inputs: [
                  '$data',
                  { $concatArrays: [[null], '$data.createdAt'] },
                ],
              },
            },
          },
        },
        { $unwind: { path: '$documentAndNextPostTime' } },
        {
          $replaceWith: {
            $mergeObjects: [
              { $arrayElemAt: ['$documentAndNextPostTime', 0] },
              {
                nextPostTime: { $arrayElemAt: ['$documentAndNextPostTime', 1] },
              },
            ],
          },
        },
        {
          $set: {
            time_difference: {
              $dateDiff: {
                startDate: '$createdAt',
                endDate: '$nextPostTime',
                unit: 'minute',
              },
            },
          },
        },
        { $unset: 'nextPostTime' },
        { $set: { emotion: { $arrayElemAt: ['$emotions.type', 0] } } },
        {
          $set: {
            nextDate: {
              $add: [
                {
                  $dateFromString: {
                    dateString: '$date',
                  },
                },
                24 * 60 * 60000,
              ],
            },
          },
        },
        {
          $set: {
            time_difference: {
              $ifNull: [
                '$time_difference',
                {
                  $dateDiff: {
                    startDate: '$createdAt',
                    endDate: '$nextDate',
                    unit: 'minute',
                  },
                },
              ],
            },
          },
        },
        { $unset: ['nextDate'] },
        {
          $group: {
            _id: {
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' },
            },
            data: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            data: 1,
          },
        },
        { $unset: ['data.date', 'data._id', 'data.month'] },
      ])
      .toArray();
    const finalData = [];
    for (const dataDetail of aggregateData) {
      const d = new Date(dataDetail.date.year, dataDetail.date.month - 1, 1);
      const data: any = {
        date: monthNames[d.getMonth()] + ' ' + dataDetail.date.year,
      };
      const groupByEmotion = dataDetail.data.reduce((group, d) => {
        const { emotion } = d;
        group[emotion] = group[emotion] ?? [];
        group[emotion].push(d);
        return group;
      }, {});
      for (const key of Object.keys(groupByEmotion)) {
        groupByEmotion[key] = groupByEmotion[key].reduce(
          (accumulator, object) => {
            if (object.time_difference > 120) {
              object.time_difference = 120;
            }
            return accumulator + object.time_difference;
          },
          0,
        );
      }
      const totalSum = Object.keys(groupByEmotion).reduce((prev, key) => {
        return prev + groupByEmotion[key];
      }, 0);
      data.moodDistribution = Object.keys(groupByEmotion).reduce(
        (prev, key) => {
          return {
            ...prev,
            [key]: Math.round((groupByEmotion[key] / totalSum) * 100),
          };
        },
        {},
      );
      finalData.push(data);
    }
    return finalData;
  }

  async getConnectionsPosts(user, type: string) {
    if (type === 'followers') {
      const followersIds = await this.connectionsService.getFollowersIds(user);
      const posts = await this.journalMongoRepository.findBy({
        createdBy: { $in: followersIds },
      });
      return posts;
    }

    if (type === 'following') {
      const followingIds = await this.connectionsService.getFollowingsIds(user);
      const posts = await this.journalMongoRepository.findBy({
        createdBy: { $in: followingIds },
      });
      return posts;
    }

    if (type === 'connected') {
      const connectionsIds = await this.connectionsService.getConnectionsIds(
        user,
      );
      const posts = await this.journalMongoRepository.findBy({
        createdBy: { $in: connectionsIds },
      });
      return posts;
    }

    return {
      error: 'Invalid Type',
    };
  }
}
