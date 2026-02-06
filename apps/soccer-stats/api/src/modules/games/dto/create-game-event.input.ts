import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsUUID,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  ValidateIf,
} from 'class-validator';

@InputType()
export class CreateGameEventInput {
  @Field(() => ID)
  @IsUUID()
  gameId: string;

  @Field(() => ID)
  @IsUUID()
  eventTypeId: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => !o.externalPlayerName)
  playerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @ValidateIf((o) => !o.playerId)
  externalPlayerName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  externalPlayerNumber?: string;

  @Field(() => ID)
  @IsUUID()
  recordedByUserId: string;

  @Field(() => ID)
  @IsUUID()
  gameTeamId: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  parentEventId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  position?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
