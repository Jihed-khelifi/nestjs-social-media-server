import {Emotion} from "../../emotions/entities/emotion.entity";
import {LocationType} from "../../users/dto/create-user.dto";

export class CreateJournalDto {
    id?: string;
    emotions: Emotion[];
    category: string;
    type: string;
    description: string;
    createdBy?: string;
    userLocation?: LocationType;
    userCountry?: string;
}

