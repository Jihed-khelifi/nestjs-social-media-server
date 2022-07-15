import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity('categories')
export class Category {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    title: string;

    @Column()
    type: string;
}
