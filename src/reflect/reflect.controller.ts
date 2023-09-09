import { Controller, Post, Body } from '@nestjs/common';
import { ReflectService } from './reflect.service';

@Controller('reflect')
export class ReflectController {
  constructor(private readonly reflectService: ReflectService) {}

  @Post()
  async fetchFromOpenAI(@Body() body: { userInput: string }): Promise<any> {
    return await this.reflectService.fetchFromOpenAI(body.userInput);
  }
}
