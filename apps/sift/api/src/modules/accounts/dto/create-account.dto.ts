import { IsEmail, IsEnum, IsUUID } from 'class-validator';
import { AccountProvider } from '@garage/sift/types';

export class CreateAccountDto {
  @IsEmail()
  email: string;

  @IsEnum(AccountProvider)
  provider: AccountProvider;

  @IsUUID()
  userId: string;
}
