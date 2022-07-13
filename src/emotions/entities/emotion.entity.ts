import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity('emotions')
export class Emotion {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    title: string;

    @Column()
    type: string;
}
