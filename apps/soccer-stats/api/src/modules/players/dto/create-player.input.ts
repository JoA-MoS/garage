import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreatePlayerInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MaxLength(255)
  firstName: string;

  @Field()
  @IsString()
  @MaxLength(255)
  lastName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @Field()
  @IsString()
  passwordHash: string;
}
