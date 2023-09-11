import { IsString, IsEmail, IsNumber } from "class-validator";

export class CreatePaymentDto {
    @IsString()
    amountPayed: string

    @IsString()
    status: string

    @IsString()
    paymentMethod: string

    @IsString()
    payerName: string

    @IsEmail()
    payerEmail: string
}