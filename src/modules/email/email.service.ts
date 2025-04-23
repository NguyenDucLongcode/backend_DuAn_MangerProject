import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendEmailOptions } from './type';
import { formatExpiresIn } from '@/common/utils/format.utils';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { to, subject, template, context, attachments } = options;

    await this.mailerService.sendMail({
      to,
      subject,
      template, // tên file .hbs không cần đuôi
      context, // object chứa biến truyền vào template
      attachments,
    });
  }

  async sendConfirmationEmail(
    to: string,
    email: string,
    confirmLink: string,
    expiresIn: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Xác nhận đăng ký tài khoản',
      template: 'confirmEmail',
      context: { email, confirmLink, expiresIn: formatExpiresIn(expiresIn) },
    });
  }

  // Send forgot password email with reset link
  async sendForgotPasswordEmail(
    to: string,
    email: string,
    resetLink: string,
    expiresIn: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Reset your password',
      template: 'forgotPassword',
      context: {
        email,
        resetLink,
        expiresIn: formatExpiresIn(expiresIn),
        year: new Date().getFullYear(),
      },
    });
  }
}
