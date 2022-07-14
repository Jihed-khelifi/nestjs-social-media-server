import { Controller, Get, Param } from '@nestjs/common';
import { EmotionsService } from './emotions.service';

@Controller('emotions')
export class EmotionsController {
  constructor(private readonly emotionsService: EmotionsService) {}
  @Get()
  findAll() {
    return this.emotionsService.aggregateByType();
  }
  @Get(':type')
  findByType(@Param('type') type: string) {
    return this.emotionsService.findByType(type);
  }
}
