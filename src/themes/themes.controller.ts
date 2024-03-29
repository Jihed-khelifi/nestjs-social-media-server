import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ThemesService } from './themes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { ObjectId } from 'mongodb';

@Controller('themes')
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.themesService.getMyThemes(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Get('resources')
  getResourcesThemes(@Query('page') page = 0, @Request() req) {
    return this.themesService.getResourcesThemes(req.user.id, page);
  }
  @UseGuards(JwtAuthGuard)
  @Get('public')
  getPublicThemes(@Request() req) {
    return this.themesService.getPublicThemes(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() themeDto: CreateThemeDto) {
    return this.themesService.createTheme(themeDto, req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Put()
  update(@Request() req, @Body() themeDto: UpdateThemeDto) {
    return this.themesService.update(themeDto, req.user.id);
  }
  // @UseGuards(JwtAuthGuard)
  // @Put('admin')
  // updateAdmin(@Request() req) {
  //   return this.themesService.updateDefault();
  // }
  @UseGuards(JwtAuthGuard)
  @Put('shareTheme/:id')
  makeThemePublic(@Request() req, @Param('id') id: string) {
    return this.themesService.shareTheme(id, req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteTheme(@Param('id') id: string) {
    return this.themesService.deleteTheme(new ObjectId(id));
  }
}
