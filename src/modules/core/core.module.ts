import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GroupDevModule } from '../group-dev/group-dev.module';
import { GroupLeaderModule } from '../group-leader/group-leader.module';
import { GroupMemberModule } from '../group-member/group-member.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    GroupDevModule,
    GroupLeaderModule,
    GroupMemberModule,
    ProjectsModule,
  ], // Import các module cần thiết vào đây
  exports: [
    AuthModule,
    UsersModule,
    GroupDevModule,
    GroupLeaderModule,
    GroupMemberModule,
    ProjectsModule,
  ], // Export lại các module này để có thể sử dụng ở nơi khác
})
export class CoreModule {}
