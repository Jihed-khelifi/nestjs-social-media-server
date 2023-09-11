import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigEntity } from '../config.entity';
import { MongoRepository } from 'typeorm';

@Injectable()
export class ReflectService {
  constructor(
    @InjectRepository(ConfigEntity)
    private configEntityMongoRepository: MongoRepository<ConfigEntity>,
  ) {}
  async fetchFromOpenAI(userInput: string, systemInput: string): Promise<any> {
    const configEntity = await this.configEntityMongoRepository.findOne({});
    const apiKey = configEntity.openAPIKey;
    const messages = [
      {
        role: 'system',
        content: systemInput,
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
