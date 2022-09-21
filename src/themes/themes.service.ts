import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ThemeEntity } from './entities/theme.entity';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { ObjectId } from 'mongodb';
import { UserThemeEntity } from './entities/user_theme.entity';

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
    const aggregatedTheme = await this.userThemeEntityMongoRepository
      .aggregate([
        {
          $match: {
            isPublic: true,
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
      ])
      .toArray();
    return {
      continuemDefault,
      popularThemes: aggregatedTheme,
    };
  }
  async applyTheme(themeId, userId) {
    const theme = await this.themeEntityMongoRepository.findOneBy({
      _id: themeId,
    });
    const userTheme = await this.userThemeEntityMongoRepository.findOneBy({
      userId: new ObjectId(userId),
    });
    if (userTheme) {
      return this.userThemeEntityMongoRepository.update(userTheme._id, {
        themeId,
        isPublic: theme.isPublic,
      });
    } else {
      return this.userThemeEntityMongoRepository.save({
        userId,
        themeId,
        isPublic: theme.isPublic,
      });
    }
  }
  async createTheme(themeDto: CreateThemeDto, userId) {
    return this.themeEntityMongoRepository.save({
      ...themeDto,
      userId: new ObjectId(userId),
    });
  }

  async shareTheme(themeId) {
    const id = new ObjectId(themeId);
    await this.userThemeEntityMongoRepository.updateMany(
      { themeId },
      { isPublic: true },
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
}
