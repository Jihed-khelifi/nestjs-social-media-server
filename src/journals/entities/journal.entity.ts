import {Entity, Column, ObjectIdColumn, ObjectID, CreateDateColumn} from 'typeorm';
import {Emotion} from "../../emotions/entities/emotion.entity";
import {LocationType} from "../../users/dto/create-user.dto";

@Entity('journals')
export class Journal {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    emotions: Emotion[];

    @Column()
    category: string;

    @Column()
    description: string;

    @Column()
    type: string;

    @ObjectIdColumn()
    createdBy: ObjectID;

    @ObjectIdColumn()
    userLocation: LocationType;

    @Column()
    userCountry: string;

    @CreateDateColumn()
    createdAt: Date;
}
