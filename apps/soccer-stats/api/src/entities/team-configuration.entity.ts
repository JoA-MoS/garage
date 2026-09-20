import { Entity, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { Team } from './team.entity';
import { GameFormat } from './game-format.entity';
import { StatsFeatures, DEFAULT_STATS_FEATURES } from './stats-features.type';

export enum PlayerNameDisplayFormat {
  FIRST_NAME = 'FIRST_NAME',
  LAST_NAME = 'LAST_NAME',
  FIRST_LAST = 'FIRST_LAST',
  LAST_COMMA_FIRST = 'LAST_COMMA_FIRST',
  FIRST_LASTINITIAL = 'FIRST_LASTINITIAL',
  FIRSTINITIAL_LASTINITIAL = 'FIRSTINITIAL_LASTINITIAL',
  FIRSTINITIAL_LAST = 'FIRSTINITIAL_LAST',
}

registerEnumType(PlayerNameDisplayFormat, {
  name: 'PlayerNameDisplayFormat',
  description:
    'Controls how a team\'s players are displayed (e.g. "First Last" vs "Last, First")',
});

export enum JerseyNumberPosition {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

registerEnumType(JerseyNumberPosition, {
  name: 'JerseyNumberPosition',
  description: 'Where the jersey number is placed relative to a player name',
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

  @Field(() => StatsFeatures, {
    description: "Default stats features for this team's games",
  })
  @Column({
    type: 'jsonb',
    default: () => `'${JSON.stringify(DEFAULT_STATS_FEATURES)}'`,
  })
  statsFeatures: StatsFeatures;

  @Field(() => PlayerNameDisplayFormat, {
    description:
      "How this team's players are displayed (e.g. game rosters, stats)",
  })
  @Column({
    type: 'enum',
    enum: PlayerNameDisplayFormat,
    default: PlayerNameDisplayFormat.FIRST_LAST,
  })
  playerNameDisplayFormat: PlayerNameDisplayFormat;

  @Field({
    description: 'Whether to show jersey numbers alongside player names',
  })
  @Column({ default: true })
  showJerseyNumber: boolean;

  @Field(() => JerseyNumberPosition)
  @Column({
    type: 'enum',
    enum: JerseyNumberPosition,
    default: JerseyNumberPosition.BEFORE,
  })
  jerseyNumberPosition: JerseyNumberPosition;

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
