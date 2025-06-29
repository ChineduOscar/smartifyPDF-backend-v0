import { Controller, Param, Get, Post, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from 'src/auth/guard';
import { Roles } from 'src/auth/decorators';
import { RolesGuard } from 'src/auth/guard';

@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createPlan() {
    return await this.plans.createPlan();
  }

  @Get()
  async getAllPlans() {
    return await this.plans.getAllPlans();
  }

  @Get(':id')
  async getPlanById(@Param('id') id: string) {
    return await this.plans.getPlanById(id);
  }
}
