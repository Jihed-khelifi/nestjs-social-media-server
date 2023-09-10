import { Emotion } from '../../emotions/entities/emotion.entity';

export class CreateJournalDto {
  id?: string;
  emotions: Emotion[];
  category: string;
  type: string;
  description: string;
  createdBy?: string;
  isTriggering?: boolean;
  emotionCanBeLogged?: boolean;
  isEncrypted?: boolean;
}
