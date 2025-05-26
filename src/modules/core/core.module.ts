import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GroupDevModule } from '../group-dev/group-dev.module';
import { GroupLeaderModule } from '../group-leader/group-leader.module';
import { GroupMemberModule } from '../group-member/group-member.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ReviewModule } from '../review/review.module';
import { NotificationModule } from '../notification/notification.module';
import { ChatModule } from '../chat/chat.module';
import { OrderModule } from '../order/order.module';
import { PaymentModule } from '../payment/payment.module';
import { FileModule } from '../file/file.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    GroupDevModule,
    GroupLeaderModule,
    GroupMemberModule,
    ProjectsModule,
    TasksModule,
    SubscriptionModule,
    ReviewModule,
    NotificationModule,
    ChatModule,
    OrderModule,
    PaymentModule,
    FileModule,
    EmailModule,
  ], // Import các module cần thiết vào đây
  exports: [
    AuthModule,
    UsersModule,
    GroupDevModule,
    GroupLeaderModule,
    GroupMemberModule,
    ProjectsModule,
    TasksModule,
    SubscriptionModule,
    ReviewModule,
    NotificationModule,
    ChatModule,
    OrderModule,
    PaymentModule,
    FileModule,
    EmailModule,
  ], // Export lại các module này để có thể sử dụng ở nơi khác
})
export class CoreModule {}
