import { IsString, IsEmail, IsNumber } from "class-validator";

export class CreatePaymentDto {
    @IsString()
    date: Date

    @IsNumber()
    amountPayed: number

    @IsString()
    status: string

    @IsString()
    paymentMethod: string

    @IsString()
    payerId: string

    @IsString()
    payerName: string

    @IsEmail()
    payerEmail: string
}