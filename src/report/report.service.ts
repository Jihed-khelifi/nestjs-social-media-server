import { Injectable } from '@nestjs/common';
import { ReportDto } from './dto/report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ReportEntity } from './entities/report.entity';
import { UsersService } from '../users/users.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(ReportEntity)
    private reportEntityMongoRepository: MongoRepository<ReportEntity>,
  ) {}

  create(reportDto: ReportDto) {
    return this.reportEntityMongoRepository.save(reportDto);
  }
  find(dataId: string, userId: any) {
    return this.reportEntityMongoRepository.findOne({
      where: {
        dataId: new ObjectId(dataId),
        reportedBy: new ObjectId(userId),
      },
    });
  }
  async markStatus(dataId: string, status: string) {
    const report = await this.reportEntityMongoRepository.findOne({
      where: {
        dataId: new ObjectId(dataId),
      },
    });
    report.status = status;
    await this.reportEntityMongoRepository.update(
      { id: report.id },
      { ...report },
    );
    return report;
  }
  getAllReportedData() {
    return this.reportEntityMongoRepository
      .aggregate([
        {
          $match: {
            status: 'REPORTED',
          },
        },
        {
          $group: {
            _id: '$dataId',
            data: { $first: '$$ROOT' },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $replaceRoot: {
            newRoot: { $mergeObjects: [{ count: '$count' }, '$data'] },
          },
        },
        {
          $lookup: {
            from: 'journals',
            localField: 'dataId',
            foreignField: '_id',
            as: 'journal',
            pipeline: [
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
            ],
          },
        },
        {
          $lookup: {
            from: 'comments',
            localField: 'dataId',
            foreignField: '_id',
            pipeline: [
              {
                $lookup: {
                  from: 'journals',
                  localField: 'postId',
                  foreignField: '_id',
                  pipeline: [
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
                  ],
                  as: 'post',
                },
              },
              { $unwind: '$post' },
            ],
            as: 'comment',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'reportedUser',
            foreignField: '_id',
            as: 'reportedUser',
          },
        },
        { $unwind: '$reportedUser' },
        {
          $project: {
            'reportedUser.password': 0,
            'reportedUser.activationKey': 0,
            'reportedUser.otp': 0,
            'reportedUser.otpSentAt': 0,
            'reportedUser.isActive': 0,
          },
        },
        {
          $project: {
            type: 1,
            status: 1,
            reason: 1,
            reportedUser: 1,
            reportedBy: 1,
            reportedAt: 1,
            count: 1,
            data: {
              $switch: {
                branches: [
                  {
                    case: {
                      $eq: ['$journal', []],
                    },
                    then: '$comment',
                  },
                ],
                default: '$journal',
              },
            },
          },
        },
        { $unwind: '$data' },
      ])
      .toArray();
  }
}
