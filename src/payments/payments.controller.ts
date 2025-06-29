import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  HttpCode,
  Headers,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { InitiatePaymentDto } from 'src/dto';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/auth/guard';
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  async initiatePayment(@Body() dto: InitiatePaymentDto) {
    return await this.paymentService.initiatePayment(dto);
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(@Query('tx_ref') tx_ref: string) {
    return await this.paymentService.verifyPayment(tx_ref);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)

  async handleWebhook(
    @Body() payload: any,
    @Headers('verif-hash') signature: string,
  ) {
    return this.paymentService.handleFlutterWebhook(payload, signature);
  }
}
