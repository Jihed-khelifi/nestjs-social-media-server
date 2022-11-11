import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ThemeEntity } from './entities/theme.entity';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { ObjectId } from 'mongodb';
import { UserThemeEntity } from './entities/user_theme.entity';
import * as moment from 'moment';

@Injectable()
export class ThemesService {
  constructor(
    @InjectRepository(ThemeEntity)
    private themeEntityMongoRepository: MongoRepository<ThemeEntity>,
    @InjectRepository(UserThemeEntity)
    private userThemeEntityMongoRepository: MongoRepository<UserThemeEntity>,
  ) {}

  async getTheme(id) {
    if (!id) {
      return null;
    }
    return this.themeEntityMongoRepository.findOneBy({ _id: new ObjectId(id) });
  }

  async getMyThemes(userId) {
    return this.themeEntityMongoRepository.findBy({
      userId: new ObjectId(userId),
    });
  }

  async deleteTheme(themeId) {
    return this.themeEntityMongoRepository.deleteOne({ _id: themeId });
  }

  async getPublicThemes(userId) {
    const continuemDefault = await this.themeEntityMongoRepository.findOneBy({
      userId: new ObjectId(userId),
      default: true,
    });
    const popularThemes = await this.userThemeEntityMongoRepository
      .aggregate(this.getAggregatePipelines({}))
      .toArray();
    const trendingThemes = await this.userThemeEntityMongoRepository
      .aggregate(
        this.getAggregatePipelines({
          createdAt: {
            $gte: new Date(moment().subtract(3, 'days').format('YYYY/MM/DD')),
            $lt: new Date(
              new Date(moment().format('YYYY/MM/DD')).getTime() +
                60 * 60 * 24 * 1000,
            ),
          },
        }),
      )
      .toArray();
    const newThemes = await this.themeEntityMongoRepository
      .aggregate([
        {
          $match: {
            isPublic: true,
            createdAt: {
              $gte: new Date(moment().format('YYYY/MM/DD')),
              $lt: new Date(
                new Date(moment().format('YYYY/MM/DD')).getTime() +
                  60 * 60 * 24 * 1000,
              ),
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
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
      ])
      .toArray();
    return {
      continuemDefault,
      popularThemes: popularThemes,
      trendingThemes: trendingThemes,
      newThemes,
    };
  }

  getAggregatePipelines(matchCondition) {
    return [
      {
        $match: {
          isPublic: true,
          ...matchCondition,
        },
      },
      {
        $lookup: {
          from: 'themes',
          localField: 'themeId',
          foreignField: '_id',
          as: 'theme',
        },
      },
      { $unwind: '$theme' },
      {
        $group: {
          _id: '$theme._id',
          count: { $sum: 1 },
          theme: { $first: '$theme' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'theme.userId',
          foreignField: '_id',
          as: 'theme.user',
        },
      },
      { $unwind: '$theme.user' },
      {
        $project: {
          'theme.user.password': 0,
          'theme.user.activationKey': 0,
          'theme.user.isActive': 0,
          'theme.user.otpSentAt': 0,
          'theme.user.otp': 0,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ];
  }

  async applyTheme(themeId, userId) {
    const theme = await this.themeEntityMongoRepository.findOneBy({
      _id: themeId,
    });
    const userTheme = await this.userThemeEntityMongoRepository.findOneBy({
      userId: new ObjectId(userId),
      themeId: new ObjectId(themeId),
    });
    if (userTheme) {
      return this.userThemeEntityMongoRepository.update(themeId, {
        isPublic: theme.isPublic,
        createdAt: new Date(),
      });
    } else {
      return this.userThemeEntityMongoRepository.save({
        userId,
        themeId,
        isPublic: theme.isPublic,
        createdAt: new Date(),
      });
    }
  }

  async createTheme(themeDto: CreateThemeDto, userId) {
    return this.themeEntityMongoRepository.save({
      ...themeDto,
      userId: new ObjectId(userId),
      createdAt: new Date(),
    });
  }

  async shareTheme(themeId, userId) {
    const id = new ObjectId(themeId);
    const user_id = new ObjectId(userId);
    await this.userThemeEntityMongoRepository.updateMany(
      { themeId: id },
      {
        $set: {
          isPublic: true,
          themeId: id,
          userId: user_id,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    return this.themeEntityMongoRepository.update(id, {
      isPublic: true,
    });
  }

  async update(themeDto: UpdateThemeDto, userId) {
    const id = new ObjectId(themeDto._id);
    return this.themeEntityMongoRepository.update(id, {
      ...themeDto,
      default: false,
      _id: id,
      userId: new ObjectId(userId),
    });
  }
  async updateDefault() {
    const defaultThemes = await this.themeEntityMongoRepository.findBy({
      name: 'Continuem Default',
    });
    for (let theme of defaultThemes) {
      const id = new ObjectId(theme._id);
      theme = {
        ...theme,
        ...{
          accentColor: '#DDDDDD',
          bgColor: '#FFFFFF',
          borderColor: '#f2efea',
          cardBackground: '#F9F9F9',
          name: 'Continuem Default',
          negativeColor: '#DD0000',
          negativeTextColor: '#FFFFFF',
          neutralColor: '#FFB329',
          neutralTextColor: '#FFFFFF',
          positiveColor: '#00B012',
          positiveTextColor: '#FFFFFF',
          primaryColor: '#804BC7',
          primaryTextColor: '#404040',
          routineTextColor: '#4D4D4D',
          secondaryBackgroundColor: '#FFFFFF',
          default: true,
        },
      };
      await this.themeEntityMongoRepository.update(id, {
        ...theme,
        _id: id,
        userId: new ObjectId(theme.userId),
      });
    }
  }
}
