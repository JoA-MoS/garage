import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { Team } from './team.entity';
import { ExternalGameMapping } from './external-game-mapping.entity';

export enum CalendarProvider {
  PLAYMETRICS = 'playmetrics',
}

export enum CalendarSyncStatus {
  NEVER_SYNCED = 'never_synced',
  SUCCESS = 'success',
  ERROR = 'error',
}

registerEnumType(CalendarProvider, {
  name: 'CalendarProvider',
  description: 'External calendar provider used as a team schedule source',
});

registerEnumType(CalendarSyncStatus, {
  name: 'CalendarSyncStatus',
  description: 'Most recent sync result for a team calendar source',
});

@ObjectType()
@Entity('team_calendar_sources')
export class CalendarSource extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  teamId!: string;

  @Field(() => CalendarProvider)
  @Column({ type: 'varchar', length: 50 })
  provider!: CalendarProvider;

  @Field()
  @Column({ type: 'text' })
  feedUrl!: string;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  calendarName?: string;

  @Field()
  @Column({ default: true })
  enabled!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @Field(() => CalendarSyncStatus)
  @Column({
    type: 'varchar',
    length: 30,
    default: CalendarSyncStatus.NEVER_SYNCED,
  })
  lastSyncStatus!: CalendarSyncStatus;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  lastSyncError?: string;

  @Field(() => Team)
  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team!: Team;

  @Field(() => [ExternalGameMapping], { nullable: true })
  @OneToMany(() => ExternalGameMapping, (mapping) => mapping.calendarSource)
  externalGameMappings?: ExternalGameMapping[];
}
