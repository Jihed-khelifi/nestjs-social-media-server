import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {MongoRepository} from "typeorm";
import {ThemeEntity} from "./entities/theme.entity";
import {CreateThemeDto} from "./dto/create-theme.dto";
import {UpdateThemeDto} from "./dto/update-theme.dto";
import {ObjectId} from 'mongodb';

@Injectable()
export class ThemesService {
    constructor(@InjectRepository(ThemeEntity) private themeEntityMongoRepository: MongoRepository<ThemeEntity>) {
    }

    async getTheme(id) {
        if (!id) {
            return null;
        }
        return this.themeEntityMongoRepository.findOneBy({_id: new ObjectId(id)});
    }

    async getMyThemes(userId) {
        return this.themeEntityMongoRepository.findBy({userId: new ObjectId(userId)});
    }

    async createTheme(themeDto: CreateThemeDto, userId) {
        return this.themeEntityMongoRepository.save({
            ...themeDto,
            userId: new ObjectId(userId)
        });
    }

    async update(themeDto: UpdateThemeDto, userId) {
        return this.themeEntityMongoRepository.update(new ObjectId(themeDto.id), {
            ...themeDto,
            _id: new ObjectId(themeDto.id),
            userId: new ObjectId(userId)
        });
    }
}
