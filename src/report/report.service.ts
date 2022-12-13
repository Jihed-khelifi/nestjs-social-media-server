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
    private userService: UsersService,
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
  getAllReportedData() {
    return this.reportEntityMongoRepository
      .aggregate([
        {
          $match: {
            status: 'REPORTED',
          },
        },
        {
          $lookup: {
            from: 'journals',
            localField: 'dataId',
            foreignField: '_id',
            as: 'journal',
          },
        },
        {
          $lookup: {
            from: 'comments',
            localField: 'dataId',
            foreignField: '_id',
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
