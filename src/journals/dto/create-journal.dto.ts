import {Emotion} from "../../emotions/entities/emotion.entity";

export class CreateJournalDto {
    emotions: Emotion[];
    category: string;
    type: string;
    description: string;
    createdBy?: string;
}

