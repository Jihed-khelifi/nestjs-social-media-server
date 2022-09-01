import {Body, Controller, Get, Post, Put, Request, UseGuards} from '@nestjs/common';
import {ThemesService} from "./themes.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {CreateThemeDto} from "./dto/create-theme.dto";
import {UpdateThemeDto} from "./dto/update-theme.dto";

@Controller('themes')
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.themesService.getMyThemes(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() themeDto: CreateThemeDto) {
    return this.themesService.createTheme(themeDto, req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Put()
  update(@Request() req, @Body() themeDto: UpdateThemeDto) {
    return this.themesService.update(themeDto);
  }
}
