import { Entity, Column, OneToMany } from 'typeorm';
import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { TeamPlayer } from './team-player.entity';
import { TeamCoach } from './team-coach.entity';
import { GameEvent } from './game-event.entity';
import { TeamMember } from './team-member.entity';

/**
 * Controls visibility of user's last name to other users.
 * @see FEATURE_ROADMAP.md section 1.4 Player Privacy System
 */
export enum LastNameVisibility {
  /** Last name visible to everyone */
  PUBLIC = 'PUBLIC',
  /** Last name only visible to team-associated users */
  TEAM_ONLY = 'TEAM_ONLY',
}

registerEnumType(LastNameVisibility, {
  name: 'LastNameVisibility',
  description: 'Controls visibility of last name to other users',
});

@ObjectType()
@Entity('users')
export class User extends BaseEntity {
  @Field({ nullable: true })
  @Column({ unique: true, length: 255, nullable: true })
  email?: string;

  @Column({ length: 255, nullable: true })
  passwordHash?: string;

  @Field()
  @Column({ length: 100 })
  firstName: string;

  @Field()
  @Column({ length: 100 })
  lastName: string;

  @Field({ nullable: true })
  @Column({ length: 20, nullable: true })
  phone?: string;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => LastNameVisibility)
  @Column({
    type: 'enum',
    enum: LastNameVisibility,
    default: LastNameVisibility.TEAM_ONLY,
  })
  lastNameVisibility: LastNameVisibility;

  @Field(() => [TeamPlayer])
  @OneToMany(() => TeamPlayer, (teamPlayer) => teamPlayer.user)
  teamPlayers: TeamPlayer[];

  @Field(() => [TeamCoach])
  @OneToMany(() => TeamCoach, (teamCoach) => teamCoach.user)
  teamCoaches: TeamCoach[];

  @Field(() => [GameEvent])
  @OneToMany(() => GameEvent, (gameEvent) => gameEvent.player)
  performedEvents: GameEvent[];

  @Field(() => [GameEvent])
  @OneToMany(() => GameEvent, (gameEvent) => gameEvent.recordedByUser)
  recordedEvents: GameEvent[];

  @Field(() => [TeamMember])
  @OneToMany(() => TeamMember, (teamMember) => teamMember.user)
  teamMemberships: TeamMember[];
}
