/**
 * TypeORM Database Entities
 *
 * These represent how the data would be stored in a relational database
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('seasons')
export class SeasonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => TeamEntity, (team) => team.season)
  teams: TeamEntity[];

  @OneToMany(() => GameEntity, (game) => game.season)
  games: GameEntity[];
}

@Entity('teams')
export class TeamEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  seasonId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => SeasonEntity, (season) => season.teams)
  @JoinColumn({ name: 'seasonId' })
  season: SeasonEntity;

  @OneToMany(() => PlayerEntity, (player) => player.team)
  players: PlayerEntity[];

  @OneToMany(() => GameEntity, (game) => game.homeTeam)
  homeGames: GameEntity[];

  @OneToMany(() => GameEntity, (game) => game.awayTeam)
  awayGames: GameEntity[];

  @OneToMany(() => GoalEntity, (goal) => goal.scoringTeam)
  goalsScored: GoalEntity[];
}

@Entity('players')
export class PlayerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  jersey: number;

  @Column()
  position: string;

  @Column()
  teamId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => TeamEntity, (team) => team.players)
  @JoinColumn({ name: 'teamId' })
  team: TeamEntity;

  @OneToMany(() => GoalEntity, (goal) => goal.scorer)
  goalsScored: GoalEntity[];

  @OneToMany(() => GoalEntity, (goal) => goal.assist)
  assists: GoalEntity[];

  @OneToMany(
    () => GameParticipationEntity,
    (participation) => participation.player
  )
  gameParticipations: GameParticipationEntity[];

  @OneToMany(() => SubstitutionEntity, (sub) => sub.playerOut)
  substitutionsOut: SubstitutionEntity[];

  @OneToMany(() => SubstitutionEntity, (sub) => sub.playerIn)
  substitutionsIn: SubstitutionEntity[];
}

@Entity('games')
export class GameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  seasonId: string;

  @Column()
  homeTeamId: string;

  @Column()
  awayTeamId: string;

  @Column({ type: 'timestamp' })
  gameDate: Date;

  @Column({
    type: 'enum',
    enum: [
      'scheduled',
      'first_half',
      'half_time',
      'second_half',
      'full_time',
      'cancelled',
    ],
    default: 'scheduled',
  })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column({ default: 0 })
  currentMinute: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => SeasonEntity, (season) => season.games)
  @JoinColumn({ name: 'seasonId' })
  season: SeasonEntity;

  @ManyToOne(() => TeamEntity, (team) => team.homeGames)
  @JoinColumn({ name: 'homeTeamId' })
  homeTeam: TeamEntity;

  @ManyToOne(() => TeamEntity, (team) => team.awayGames)
  @JoinColumn({ name: 'awayTeamId' })
  awayTeam: TeamEntity;

  @OneToMany(() => GoalEntity, (goal) => goal.game)
  goals: GoalEntity[];

  @OneToMany(
    () => GameParticipationEntity,
    (participation) => participation.game
  )
  participations: GameParticipationEntity[];

  @OneToMany(() => SubstitutionEntity, (sub) => sub.game)
  substitutions: SubstitutionEntity[];
}

@Entity('goals')
export class GoalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  gameId: string;

  @Column()
  scoringTeamId: string;

  @Column()
  scorerId: string;

  @Column({ nullable: true })
  assistId?: string;

  @Column()
  gameMinute: number;

  @CreateDateColumn()
  timestamp: Date;

  // Relationships
  @ManyToOne(() => GameEntity, (game) => game.goals)
  @JoinColumn({ name: 'gameId' })
  game: GameEntity;

  @ManyToOne(() => TeamEntity, (team) => team.goalsScored)
  @JoinColumn({ name: 'scoringTeamId' })
  scoringTeam: TeamEntity;

  @ManyToOne(() => PlayerEntity, (player) => player.goalsScored)
  @JoinColumn({ name: 'scorerId' })
  scorer: PlayerEntity;

  @ManyToOne(() => PlayerEntity, (player) => player.assists, { nullable: true })
  @JoinColumn({ name: 'assistId' })
  assist?: PlayerEntity;
}

@Entity('game_participations')
export class GameParticipationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  gameId: string;

  @Column()
  playerId: string;

  @Column()
  teamId: string;

  @Column({ default: false })
  startedOnField: boolean;

  @Column({ default: 0 })
  minutesPlayed: number;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => GameEntity, (game) => game.participations)
  @JoinColumn({ name: 'gameId' })
  game: GameEntity;

  @ManyToOne(() => PlayerEntity, (player) => player.gameParticipations)
  @JoinColumn({ name: 'playerId' })
  player: PlayerEntity;

  @ManyToOne(() => TeamEntity)
  @JoinColumn({ name: 'teamId' })
  team: TeamEntity;
}

@Entity('substitutions')
export class SubstitutionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  gameId: string;

  @Column()
  teamId: string;

  @Column()
  playerOutId: string;

  @Column()
  playerInId: string;

  @Column()
  gameMinute: number;

  @CreateDateColumn()
  timestamp: Date;

  // Relationships
  @ManyToOne(() => GameEntity, (game) => game.substitutions)
  @JoinColumn({ name: 'gameId' })
  game: GameEntity;

  @ManyToOne(() => TeamEntity)
  @JoinColumn({ name: 'teamId' })
  team: TeamEntity;

  @ManyToOne(() => PlayerEntity, (player) => player.substitutionsOut)
  @JoinColumn({ name: 'playerOutId' })
  playerOut: PlayerEntity;

  @ManyToOne(() => PlayerEntity, (player) => player.substitutionsIn)
  @JoinColumn({ name: 'playerInId' })
  playerIn: PlayerEntity;
}
