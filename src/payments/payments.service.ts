import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InitiatePaymentDto } from 'src/dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async initiatePayment(dto: InitiatePaymentDto) {
    const { planId, amount, email, userId, phoneNumber, firstName } = dto;

    try {
      const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) throw new NotFoundException('Plan not found');

      if (amount !== plan?.price) {
        throw new BadRequestException(
          `Invalid amount. Expected ₦${plan?.price}, but got ₦${amount}`,
        );
      }

      const txRef = `tx_${uuidv4().replace(/-/g, '')}`;

      await this.prisma.payment.create({
        data: {
          txRef,
          amount,
          email,
          planId,
          status: 'PENDING',
          userId,
        },
      });

      const payload = {
        tx_ref: txRef,
        amount,
        currency: 'NGN',
        redirect_url: `${this.config.get('FRONTEND_URL')}/payment/success`,
        customer: { email, phonenumber: phoneNumber, name: firstName },
        customizations: {
          title: 'Afrilearn',
          description: `Purchase of ${plan.title}`,
        },
        meta: {
          planId: planId,
          userId: userId,
        },
      };

      const response = await axios.post(
        `${this.config.get('FLW_BASE_URL')}/payments`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.config.get('FLW_SECRET_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.status !== 'success') {
        this.logger.error(`Flutterwave init failed: ${response.data.message}`);
        throw new BadRequestException('Failed to initialize payment');
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        'initiatePayment failed',
        error?.response?.data || error.message,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Failed to initialize payment');
    }
  }

  async verifyPayment(tx_ref: string) {
    if (!tx_ref) throw new NotFoundException('Missing transaction ID');
    console.log(tx_ref);

    try {
      const response = await axios.get(
        `${this.config.get('FLW_BASE_URL')}/transactions/verify_by_reference?tx_ref=${tx_ref}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.get('FLW_SECRET_KEY')}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'verify Payment failed',
        error?.response?.data || error.message,
      );

      throw new BadRequestException('Failed to verify payment');
    }
  }

  async handleFlutterWebhook(payload: any, signature: string) {
    try {
      const isValidSignature = this.verifyWebhookSignature(signature);

      if (!isValidSignature) {
        this.logger.warn('Invalid webhook signature received');
        throw new BadRequestException('Invalid signature');
      }

      const { event, data } = payload;

      if (event === 'charge.completed') {
        await this.updatePaymentStatus(data);
        const message = await this.assignUserPlan(data);

        this.logger.log(`Webhook: ${message}`);
        return { status: 'success', message: message || 'Webhook processed' };
      }

      return {
        status: 'success',
        message: 'Webhook Received',
      };
    } catch (error) {
      this.logger.error('Webhook processing failed:', error);
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }

  private verifyWebhookSignature(signature: string): boolean {
    const secret = this.config.get<string>('FLW_WEBHOOK_HASH');

    if (!secret) {
      this.logger.error('Webhook secret hash is missing from env');
      throw new Error('Missing FLW_WEBHOOK_HASH in environment variables');
    }

    if (!signature || signature !== secret) {
      this.logger.warn(
        `Invalid signature received. Expected: ${secret}, Got: ${signature}`,
      );
      return false;
    }

    return true;
  }

  private async updatePaymentStatus(data: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { txRef: data.tx_ref },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for reference: ${data.tx_ref}`);
      return;
    }

    let status: PaymentStatus;

    switch (data.status.toLowerCase()) {
      case 'successful':
        status = PaymentStatus.SUCCESS;
        break;
      case 'failed':
        status = PaymentStatus.FAILED;
        break;
      case 'cancelled':
        status = PaymentStatus.CANCELLED;
        break;
      default:
        status = PaymentStatus.PENDING;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        flutterwaveTransactionId: data.id.toString(),
        flutterwaveReference: data.flw_ref,
        flutterwaveData: data,
      },
    });

    this.logger.log(`Payment ${payment.id} updated to ${status}`);
  }

  private async assignUserPlan(data: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { txRef: data.tx_ref },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for txRef: ${data.tx_ref}`);
      return;
    }

    const [user, plan] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: payment.userId } }),
      this.prisma.plan.findUnique({ where: { id: payment.planId } }),
    ]);

    if (!user || !plan) {
      this.logger.warn('User or plan not found from payment');
      return;
    }

    const now = new Date();
    let endDate: Date | null = null;

    if (plan.durationInDays) {
      endDate = new Date(
        now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000,
      );
    }

    await this.prisma.userPlan.upsert({
      where: { userId: user.id },
      update: {
        planId: plan.id,
        paymentId: payment.id,
        startDate: now,
        endDate,
      },
      create: {
        userId: user.id,
        planId: plan.id,
        paymentId: payment.id,
        startDate: now,
        endDate,
      },
    });

    this.logger.log(`${user.email} subscribed to ${plan.title}`);
    return `Subscription to ${plan.title} successful`;
  }
}
