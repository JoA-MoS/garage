import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsOptional, IsUrl, IsUUID } from 'class-validator';

import { CalendarProvider } from '../../../entities/calendar-source.entity';

@InputType()
export class CreateCalendarSourceInput {
  @Field(() => ID)
  @IsUUID()
  teamId!: string;

  @Field(() => CalendarProvider, { defaultValue: CalendarProvider.PLAYMETRICS })
  @IsEnum(CalendarProvider)
  provider!: CalendarProvider;

  @Field()
  @IsUrl({ require_protocol: true })
  feedUrl!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
