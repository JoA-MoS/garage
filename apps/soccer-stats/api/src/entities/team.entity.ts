import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { GameTeam } from './game-team.entity';
import { TeamPlayer } from './team-player.entity';
import { TeamCoach } from './team-coach.entity';
import { TeamConfiguration } from './team-configuration.entity';
import { TeamMember } from './team-member.entity';

export enum SourceType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

registerEnumType(SourceType, {
  name: 'SourceType',
  description:
    'The source of team data - internal (user created) or external (imported)',
});

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
  isManaged: boolean;

  @Field(() => SourceType)
  @Column({
    type: 'enum',
    enum: SourceType,
    default: SourceType.INTERNAL,
  })
  sourceType: SourceType;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  externalReference?: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field({
    nullable: true,
    description: 'Clerk user ID of the team creator/owner',
  })
  @Column({ length: 255, nullable: true })
  createdById?: string;

  @Field(() => [GameTeam], { nullable: true })
  @OneToMany(() => GameTeam, (gameTeam) => gameTeam.team, { cascade: true })
  games: GameTeam[];

  @Field(() => [TeamPlayer], { nullable: true })
  @OneToMany(() => TeamPlayer, (teamPlayer) => teamPlayer.team, {
    cascade: true,
  })
  roster: TeamPlayer[];

  @Field(() => [TeamCoach], { nullable: true })
  @OneToMany(() => TeamCoach, (teamCoach) => teamCoach.team, {
    cascade: true,
  })
  coaches: TeamCoach[];

  @Field(() => TeamConfiguration, { nullable: true })
  @OneToOne(
    () => TeamConfiguration,
    (teamConfiguration) => teamConfiguration.team,
    {
      cascade: true,
    },
  )
  teamConfiguration?: TeamConfiguration;

  @Field(() => [TeamMember], { nullable: true })
  @OneToMany(() => TeamMember, (teamMember) => teamMember.team, {
    cascade: true,
  })
  teamMembers?: TeamMember[];
}
