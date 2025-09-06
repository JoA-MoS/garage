import { InputType, Field, Int, ID } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, IsUUID } from 'class-validator';

@InputType()
export class CreateGameInput {
  @Field(() => ID)
  @IsUUID()
  homeTeamId: string;

  @Field(() => ID)
  @IsUUID()
  awayTeamId: string;

  @Field(() => ID)
  @IsUUID()
  gameFormatId: string;

  @Field(() => Int, { defaultValue: 90 })
  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;
}
