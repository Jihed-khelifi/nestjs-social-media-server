import { Injectable } from "@nestjs/common/decorators/core/injectable.decorator";
import { User } from "src/users/entities/user.entity";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { MongoRepository, ObjectID } from "typeorm";
import { PaymentEntity } from "./entities/payment.entity";
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from "mongodb"


@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(PaymentEntity)
        private paymentsMongoRepo: MongoRepository<PaymentEntity>
    ) { }

    async addPayment(user: User, createPaymentDto: CreatePaymentDto) {
        this.paymentsMongoRepo.save({
            ...createPaymentDto
            , payerId: new ObjectId(user.id)
        })
    }

    async getUserPayments(user: any) {
        return this.paymentsMongoRepo.findBy({
            payerId: new ObjectId(user.id)
        })
    }
    async changePaymentStatus(user: User, paymenyId: string, status: string) {
        const payment = await this.paymentsMongoRepo.findOneBy({
            _id: new ObjectId(paymenyId)
        })
        if (payment) {
            payment.status = status;
            this.paymentsMongoRepo.save(payment)
        }
    }
}