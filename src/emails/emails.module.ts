import { forwardRef, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ActivationController } from './activation.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [EmailService],
  controllers: [ActivationController],
  exports: [EmailService],
})
export class EmailsModule {}
