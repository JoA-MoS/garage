import { Entity, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { Team } from './team.entity';
import { GameFormat } from './game-format.entity';

@ObjectType()
@Entity('team_configurations')
export class TeamConfiguration extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  teamId: string;

  @Field(() => ID)
  @Column('uuid')
  defaultGameFormatId: string;

  @Field()
  @Column({ length: 50, default: '4-4-2' })
  defaultFormation: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 90 })
  defaultGameDuration: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 11 })
  defaultPlayerCount: number;

  @Field(() => Team)
  @OneToOne(() => Team, (team) => team.teamConfiguration)
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Field(() => GameFormat)
  @ManyToOne(() => GameFormat, (gameFormat) => gameFormat.teamConfigurations)
  @JoinColumn({ name: 'defaultGameFormatId' })
  defaultGameFormat: GameFormat;
}
