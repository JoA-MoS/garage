import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

@InputType()
export class CreateGameFormatInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  displayName: string;

  @Field(() => Int)
  @IsInt()
  @Min(3)
  @Max(15)
  playersPerSide: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  minPlayers?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  maxSubstitutions?: number;

  @Field(() => Int, { defaultValue: 90 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(120)
  defaultDuration?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
