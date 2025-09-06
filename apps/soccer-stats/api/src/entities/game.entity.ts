import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { GameTeam } from './game-team.entity';
import { GameEvent } from './game-event.entity';
import { GameFormat } from './game-format.entity';

@ObjectType()
@Entity('games')
export class Game extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  gameFormatId: string;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  name?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  scheduledStart?: Date;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  venue?: string;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  weatherConditions?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field(() => GameFormat)
  @ManyToOne(() => GameFormat, (gameFormat) => gameFormat.games, {
    nullable: false,
  })
  @JoinColumn({ name: 'gameFormatId' })
  gameFormat: GameFormat;

  @Field(() => [GameTeam])
  @OneToMany(() => GameTeam, (gameTeam) => gameTeam.game, { cascade: true })
  gameTeams: GameTeam[];

  @Field(() => [GameEvent])
  @OneToMany(() => GameEvent, (gameEvent) => gameEvent.game, { cascade: true })
  gameEvents: GameEvent[];
}
