import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ReflectService {
  async fetchFromOpenAI(userInput: string): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY;
    const messages = [
      {
        role: 'system',
        content:
          "You are reflect AI. You provide personalized reflection questions based on input user gives you about what he is thinking about. Only give out the questions. Don't talk to the user. Don't be verbose. Put the questions in a list format. Between 4- 7. Always give reflection questions in the input language.",
      },
      {
        role: 'user',
        content: userInput,
      },
    ];

    try {
      const response = await axios.post(
        'https://reflectai.openai.azure.com/openai/deployments/ReflectAIDeployment/chat/completions?api-version=2023-07-01-preview',
        {
          messages: messages,
          temperature: 0.7,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
          max_tokens: 800,
          stop: null,
        },
        {
          headers: {
            'api-key': `${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return {
        success: true,
        error: false,
        content: response.data.choices[0].message.content,
      };
    } catch (error) {
      const errorCopy = JSON.parse(JSON.stringify(error));
      return {
        success: false,
        error: true,
        status: errorCopy.status,
        message:
          errorCopy.status === 400
            ? 'Sorry! The content provided goes against our guidelines. Please try again with another message.'
            : 'Service is temporary unavailable.',
      };
    }
  }
}
