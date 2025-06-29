import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPlan() {
    try {
      await this.prisma.plan.deleteMany();

      const sessionPrice = 7000;

      const calcDiscount = (original: number, discounted: number) => {
        const percent = ((original - discounted) / original) * 100;
        return Math.round(percent);
      };

      await this.prisma.plan.createMany({
        data: [
          {
            title: 'Free Plan',
            price: 0,
            features: [
              'Use AI-powered learning tools',
              'No live sessions',
              'No billing required',
            ],
            buttonText: 'Explore Free',
            discount: 0,
          },
          {
            title: 'Weekly Plan',
            price: sessionPrice,
            features: [
              '1 one-on-one live session',
              'Access to AI-powered learning tools',
              'Personalized support',
              'Valid for 7 days',
              'Billed every 7 days until cancelled',
            ],
            buttonText: 'Subscribe',
            discount: 0,
          },
          {
            title: 'Biweekly Plan',
            price: 13000,
            features: [
              '2 one-on-one live sessions',
              'Access to AI-powered learning tools',
              'Personalized support',
              'Valid for 14 days',
              'Billed every 14 days until cancelled',
            ],
            buttonText: 'Subscribe',
            discount: calcDiscount(sessionPrice * 2, 13000),
          },
          {
            title: 'Monthly Plan',
            price: 25000,
            features: [
              '4 one-on-one live sessions',
              'Access to AI-powered learning tools',
              'Personalized support',
              'Valid for one month',
              'Billed monthly until cancelled',
            ],
            buttonText: 'Subscribe',
            discount: calcDiscount(sessionPrice * 4, 25000),
          },
        ],
      });

      return { message: 'Plans seeded successfully' };
    } catch (error) {
      this.logger.error('Error seeding plans', error);
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }

  async getAllPlans() {
    try {
      return await this.prisma.plan.findMany({});
    } catch (error) {
      this.logger.error('Error fetching all plans', error);
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }

  async getPlanById(id: string) {
    if (!id) throw new BadRequestException('ID is required');

    try {
      const plan = await this.prisma.plan.findUnique({
        where: { id },
      });

      if (!plan) throw new NotFoundException('Plan not found');

      return plan;
    } catch (error) {
      this.logger.error(`Error fetching plan with ID: ${id}`, error);
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }
}
