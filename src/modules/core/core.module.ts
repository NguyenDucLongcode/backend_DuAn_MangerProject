import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GroupDevModule } from '../group-dev/group-dev.module';

@Module({
  imports: [AuthModule, UsersModule, GroupDevModule], // Import các module cần thiết vào đây
  exports: [AuthModule, UsersModule, GroupDevModule], // Export lại các module này để có thể sử dụng ở nơi khác
})
export class CoreModule {}
