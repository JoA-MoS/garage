import { Entity, Column, OneToMany } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { TeamPlayer } from './team-player.entity';
import { TeamCoach } from './team-coach.entity';
import { GameEvent } from './game-event.entity';

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
}
