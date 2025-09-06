import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

import { TeamPlayer } from './team-player.entity';
import { GameParticipation } from './game-participation.entity';

@ObjectType()
@Entity('players')
export class Player {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 255 })
  name: string;

  @Field()
  @Column({ length: 100 })
  position: string;

  @Field(() => [TeamPlayer])
  @OneToMany(() => TeamPlayer, (teamPlayer) => teamPlayer.player, {
    cascade: true,
  })
  teamPlayers: TeamPlayer[];

  @Field(() => [GameParticipation])
  @OneToMany(() => GameParticipation, (participation) => participation.player, {
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
