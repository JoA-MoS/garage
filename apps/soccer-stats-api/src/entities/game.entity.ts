import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';

import { GameTeam } from './game-team.entity';
import { GameEvent } from './game-event.entity';
import { GameParticipation } from './game-participation.entity';
import { GameFormat } from './game-format.entity';

export enum GameStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(GameStatus, {
  name: 'GameStatus',
});

@ObjectType()
@Entity('games')
export class Game {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @CreateDateColumn()
  startTime: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Field(() => GameStatus)
  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.NOT_STARTED,
  })
  status: GameStatus;

  @Field(() => GameFormat)
  @ManyToOne(() => GameFormat, (gameFormat) => gameFormat.games, {
    nullable: false,
  })
  @JoinColumn({ name: 'game_format_id' })
  gameFormat: GameFormat;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  currentTime: number; // Game time in seconds

  @Field(() => Int)
  @Column({ type: 'int', default: 90 })
  duration: number; // Total game duration in minutes

  @Field(() => [GameTeam])
  @OneToMany(() => GameTeam, (gameTeam) => gameTeam.game, { cascade: true })
  gameTeams: GameTeam[];

  @Field(() => [GameEvent])
  @OneToMany(() => GameEvent, (gameEvent) => gameEvent.game, { cascade: true })
  gameEvents: GameEvent[];

  @Field(() => [GameParticipation])
  @OneToMany(() => GameParticipation, (participation) => participation.game, {
    cascade: true,
  })
  participations: GameParticipation[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
