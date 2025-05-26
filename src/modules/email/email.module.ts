import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { join, resolve } from 'path';

const templateDir =
  process.env.NODE_ENV === 'production'
    ? resolve(process.cwd(), 'dist', 'templates', 'email-templates') // khi chạy dist
    : resolve(process.cwd(), 'src', 'templates', 'email-templates'); // khi chạy ts-node

console.log('chek env', process.env.NODE_ENV);
console.log('Template directory:', templateDir);
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_EMAIL}>`,
      },

      template: {
        dir: templateDir,
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
