import { Body, Controller, Post } from '@nestjs/common';
import { MailingService } from './mailing.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiTags } from '@nestjs/swagger';
import { ChangePasswordTokenDto } from './dto/change-password-token.dto';

@ApiTags('Mailing')
@Controller('mailing')
export class MailingController {
  constructor(readonly mailingService: MailingService) {}

  @Post('forgot-password')
  async sendMail(@Body() changePasswordDto: ChangePasswordDto) {
    return await this.mailingService.sendMailRecovery(changePasswordDto);
  }

  @Post('change-password')
  async changePassword(@Body() changePasswordtokenDto: ChangePasswordTokenDto) {
    return await this.mailingService.changePassword(changePasswordtokenDto);
  }
}
