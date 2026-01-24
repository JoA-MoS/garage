import { Entity, Column, OneToMany } from 'typeorm';
import { ObjectType, Field, Int } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { Game } from './game.entity';
import { TeamConfiguration } from './team-configuration.entity';

@ObjectType()
@Entity('game_formats')
export class GameFormat extends BaseEntity {
  @Field()
  @Column({ unique: true, length: 50 })
  name: string; // e.g., "11v11", "9v9", "7v7", "5v5"

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field(() => Int)
  @Column({ type: 'int' })
  playersPerTeam: number; // e.g., 11, 9, 7, 5

  @Field(() => Int)
  @Column({ type: 'int', default: 90 })
  durationMinutes: number; // Total game duration in minutes (computed: numberOfPeriods * periodDurationMinutes)

  @Field(() => Int)
  @Column({ type: 'int', default: 2 })
  numberOfPeriods: number; // Number of periods (e.g., 2 for halves, 4 for quarters)

  @Field(() => Int)
  @Column({ type: 'int', default: 45 })
  periodDurationMinutes: number; // Duration of each period in minutes

  @Field()
  @Column({ default: true })
  allowsSubstitutions: boolean;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  maxSubstitutions?: number; // Maximum substitutions allowed

  @Field(() => [Game])
  @OneToMany(() => Game, (game) => game.gameFormat)
  games: Game[];

  @Field(() => [TeamConfiguration])
  @OneToMany(
    () => TeamConfiguration,
    (teamConfiguration) => teamConfiguration.defaultGameFormat,
  )
  teamConfigurations: TeamConfiguration[];
}
