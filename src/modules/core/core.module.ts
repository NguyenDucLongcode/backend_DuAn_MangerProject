import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthModule, UsersModule], // Import các module cần thiết vào đây
  exports: [AuthModule, UsersModule], // Export lại các module này để có thể sử dụng ở nơi khác
})
export class CoreModule {}
