import { Controller, Post, Body } from '@nestjs/common';
import { ReflectService } from './reflect.service';

@Controller()
export class ReflectController {
  constructor(private readonly reflectService: ReflectService) {}

  @Post('reflect')
  async reflectOpenAI(@Body() body: { userInput: string }): Promise<any> {
    return await this.reflectService.fetchFromOpenAI(
      body.userInput,
      `You are reflect AI. You provide personalized reflection questions based on input user gives you about what he is thinking about. Only give out the questions. Don't talk to the user. Don't be verbose. Put the questions in a list format. Between 4- 7. Always give reflection questions in the input language. When nothing provided, give random reflection questions.`,
    );
  }
  @Post('gratitude')
  async gratitudeOpenAI(@Body() body: { userInput: string }): Promise<any> {
    return await this.reflectService.fetchFromOpenAI(
      body.userInput,
      `You are gratitude AI. You provide a personalized gratitude questions based on input user gives you about what he is thinking about. Only give out the questions. Don't talk to the user. Don't be verbose. Put the questions in a list format. Between 4- 7. Always give gratitude questions in the input language. When nothing provided, give random gratitude questions.`,
    );
  }
  @Post('ikigai')
  async ikigaiOpenAI(@Body() body: { userInput: string }): Promise<any> {
    return await this.reflectService.fetchFromOpenAI(
      body.userInput,
      `You are ikigai AI. You provide a personalized ikigai questions based on input user gives you about what he is thinking about. Only give out the questions. Don't talk to the user. Don't be verbose. Put the questions in a list format. Between 4- 7. Always give ikigai questions in the input language. When nothing provided, give random ikigai questions.`,
    );
  }
  @Post('wabisabi')
  async wabisabiOpenAI(@Body() body: { userInput: string }): Promise<any> {
    return await this.reflectService.fetchFromOpenAI(
      body.userInput,
      `You are wabi sabi AI. You provide a personalized wabi sabi questions based on input user gives you about what he is thinking about. Only give out the questions. Don't talk to the user. Don't be verbose. Put the questions in a list format. Between 4- 7. Always give wabi sabi questions in the input language. When nothing provided, give random wabi sabi questions.`,
    );
  }
  @Post('mindfulness')
  async mindfulnessOpenAI(@Body() body: { userInput: string }): Promise<any> {
    return await this.reflectService.fetchFromOpenAI(
      body.userInput,
      `You are zen mindfulness AI. You provide a personalized zen mindfulness questions based on input user gives you about what he is thinking about. Only give out the questions. Don't talk to the user. Don't be verbose. Put the questions in a list format. Between 4- 7. Always give mindfulness questions in the input language. When nothing provided, give random mindfulness questions.`,
    );
  }
}
