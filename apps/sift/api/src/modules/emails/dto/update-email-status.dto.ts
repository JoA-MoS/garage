import { IsEnum } from 'class-validator';

import { EmailStatus } from '@garage/sift/types';

export class UpdateEmailStatusDto {
  @IsEnum(EmailStatus)
  status: EmailStatus;
}
