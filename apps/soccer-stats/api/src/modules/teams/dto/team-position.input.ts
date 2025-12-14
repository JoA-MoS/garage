import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNumber, MaxLength } from 'class-validator';

@InputType()
export class TeamPositionInput {
  @Field()
  @IsString()
  @MaxLength(50)
  id: string;

  @Field()
  @IsString()
  @MaxLength(100)
  name: string;

  @Field()
  @IsString()
  @MaxLength(10)
  abbreviation: string;

  @Field(() => Float)
  @IsNumber()
  x: number;

  @Field(() => Float)
  @IsNumber()
  y: number;
}
