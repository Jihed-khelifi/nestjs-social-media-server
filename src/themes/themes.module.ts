import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeEntity } from './entities/theme.entity';
import { ThemesController } from './themes.controller';
import { ThemesService } from './themes.service';
import { UserThemeEntity } from './entities/user_theme.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ThemeEntity, UserThemeEntity])],
  controllers: [ThemesController],
  providers: [ThemesService],
  exports: [ThemesService],
})
export class ThemesModule {}
