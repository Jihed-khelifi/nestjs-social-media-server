import {Entity, Column, ObjectIdColumn, ObjectID} from 'typeorm';

@Entity('themes')
export class ThemeEntity {
    @ObjectIdColumn()
    id: ObjectID;

    @ObjectIdColumn()
    userId: ObjectID;

    @Column()
    name: string;

    @Column()
    bgColor: string;

    @Column()
    borderColor: string;

    @Column()
    cardBackground: string;

    @Column()
    routineTextColor: string;

    @Column()
    primaryColor: string;

    @Column()
    primaryTextColor: string;

    @Column()
    accentColor: string;

    @Column()
    positiveColor: string;

    @Column()
    negativeColor: string;

    @Column()
    neutralColor: string;

    @Column()
    positiveTextColor: string;

    @Column()
    negativeTextColor: string;

    @Column()
    neutralTextColor: string;
}
