import {
    Controller,
    Get,
    Param,
    Put,
    Request,
    Body,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
    constructor(
        private paymentsService: PaymentsService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('addPayment')
    async addPayment(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentsService.addPayment(req.user, createPaymentDto);
    }



    @UseGuards(JwtAuthGuard)
    @Get('getUserPayments')
    async getUserPayments(@Request() req) {
        return this.paymentsService.getUserPayments(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Get('changePaymentStatus/:paymentId/:status')
    async getMyPayments(@Request() req, @Param('paymentId') paymentId: string, @Param('status') status: string) {
        return this.paymentsService.changePaymentStatus(req.user, paymentId, status);
    }

}