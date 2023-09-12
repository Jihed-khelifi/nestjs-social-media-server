import {
    Entity,
    Column,
    ObjectIdColumn,
    ObjectID,
    CreateDateColumn,
} from 'typeorm';

@Entity('payments')
export class PaymentEntity {
    @ObjectIdColumn()
    id: ObjectID;

    @CreateDateColumn()
    date: Date

    @Column()
    amountPayed: string

    @Column()
    status: string

    @Column()
    paymentMethod: string

    @ObjectIdColumn({
        name: 'payerId',
    })
    payerId: ObjectID

    @Column()
    payerName: string

    @Column()
    payerEmail: string
}