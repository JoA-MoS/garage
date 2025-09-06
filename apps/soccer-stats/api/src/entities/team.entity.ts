import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { GameTeam } from './game-team.entity';
import { TeamPlayer } from './team-player.entity';
import { TeamCoach } from './team-coach.entity';
import { TeamConfiguration } from './team-configuration.entity';

@ObjectType()
@Entity('teams')
export class Team extends BaseEntity {
  @Field()
  @Column({ length: 255 })
  name: string;

  @Field({ nullable: true })
  @Column({ length: 50, nullable: true })
  shortName?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ length: 50, nullable: true })
  homePrimaryColor?: string;

  @Field({ nullable: true })
  @Column({ length: 50, nullable: true })
  homeSecondaryColor?: string;

  @Field({ nullable: true })
  @Column({ length: 50, nullable: true })
  awayPrimaryColor?: string;

  @Field({ nullable: true })
  @Column({ length: 50, nullable: true })
  awaySecondaryColor?: string;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  logoUrl?: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => [GameTeam])
  @OneToMany(() => GameTeam, (gameTeam) => gameTeam.team, { cascade: true })
  gameTeams: GameTeam[];

  @Field(() => [TeamPlayer])
  @OneToMany(() => TeamPlayer, (teamPlayer) => teamPlayer.team, {
    cascade: true,
  })
  teamPlayers: TeamPlayer[];

  @Field(() => [TeamCoach])
  @OneToMany(() => TeamCoach, (teamCoach) => teamCoach.team, {
    cascade: true,
  })
  teamCoaches: TeamCoach[];

  @Field(() => TeamConfiguration, { nullable: true })
  @OneToOne(
    () => TeamConfiguration,
    (teamConfiguration) => teamConfiguration.team,
    {
      cascade: true,
    }
  )
  teamConfiguration?: TeamConfiguration;
}
