import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ThemeEntity } from './entities/theme.entity';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { ObjectId } from 'mongodb';
import {UserThemeEntity} from "./entities/user_theme.entity";

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
  async applyTheme(themeId, userId) {
    const userTheme = await this.userThemeEntityMongoRepository.findOneBy({ userId: new ObjectId(userId) });
    if (userTheme) {
      return this.userThemeEntityMongoRepository.update(userTheme._id, {
        themeId,
      });
    } else {
      return this.userThemeEntityMongoRepository.save({
        userId,
        themeId,
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
