import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsUUID, IsInt, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class AddPlayerToTeamInput {
  @Field(() => ID)
  @IsUUID()
  teamId: string;

  @Field(() => ID)
  @IsUUID()
  playerId: string;

  @Field(() => Int)
  @IsInt()
  jersey: number;

  @Field(() => Int, { defaultValue: 1 })
  @IsOptional()
  @IsInt()
  depthRank?: number;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
