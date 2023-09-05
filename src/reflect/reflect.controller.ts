import { Controller, Post, Body } from '@nestjs/common';
import { ReflectService } from './reflect.service';

@Controller()
export class ReflectController {
  constructor(private readonly reflectService: ReflectService) {}

  @Post('reflect')
  async fetchFromOpenAI(@Body() body: { userInput: string }): Promise<any> {
    return await this.reflectService.fetchFromOpenAI(body.userInput);
  }
}
