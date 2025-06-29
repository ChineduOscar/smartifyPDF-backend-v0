import { Controller, Patch, UseGuards, Body } from '@nestjs/common';
import { CompleteProfileDto } from 'src/dto/complete-profile.dto';
import { UserService } from './user.service';
import { CurrentUser } from 'src/auth/decorators';
import { JwtAuthGuard } from 'src/auth/guard';
import { ChangeEmailDto } from 'src/dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Patch('complete-profile')
  @UseGuards(JwtAuthGuard)
  async completeProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.userService.completeProfile(userId, dto);
  }

  @Patch('change-email')
  async changeEmail(@Body() dto: ChangeEmailDto) {
    return this.userService.changeEmailAndResendCode(dto);
  }
}
