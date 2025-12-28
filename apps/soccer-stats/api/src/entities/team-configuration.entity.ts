import { Entity, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { Team } from './team.entity';
import { GameFormat } from './game-format.entity';

export enum StatsTrackingLevel {
  FULL = 'FULL', // Track scorer and assister
  SCORER_ONLY = 'SCORER_ONLY', // Track only the scorer
  GOALS_ONLY = 'GOALS_ONLY', // Track goals without player attribution
}

registerEnumType(StatsTrackingLevel, {
  name: 'StatsTrackingLevel',
  description: 'Level of detail for tracking game statistics',
});

@ObjectType()
@Entity('team_configurations')
export class TeamConfiguration extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  teamId: string;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  defaultGameFormatId: string | null;

  @Field()
  @Column({ length: 50, default: '4-4-2' })
  defaultFormation: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 90 })
  defaultGameDuration: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 11 })
  defaultPlayerCount: number;

  @Field(() => StatsTrackingLevel)
  @Column({
    type: 'varchar',
    length: 20,
    default: StatsTrackingLevel.FULL,
  })
  statsTrackingLevel: StatsTrackingLevel;

  // TODO: Add defaultLineup field when implementing lineup defaults feature
  // Will need graphql-type-json package for GraphQLJSON scalar
  // JSON mapping of position names to player IDs
  // Example: { "GK": "uuid-1", "LB": "uuid-2", "CB": "uuid-3" }

  @Field(() => Team)
  @OneToOne(() => Team, (team) => team.teamConfiguration)
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Field(() => GameFormat, { nullable: true })
  @ManyToOne(() => GameFormat, (gameFormat) => gameFormat.teamConfigurations, {
    nullable: true,
  })
  @JoinColumn({ name: 'defaultGameFormatId' })
  defaultGameFormat: GameFormat | null;
}
