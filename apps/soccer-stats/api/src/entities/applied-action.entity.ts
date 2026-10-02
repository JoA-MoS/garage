import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { Game } from './game.entity';

/**
 * Receipt for a client action that has been applied.
 *
 * The client outbox retries actions until it gets a response, so the same
 * action can arrive more than once (e.g. the first response was lost). The
 * receipt is written in the same transaction as the action's events, and a
 * retry returns the recorded result instead of writing again.
 *
 * Receipts are kept when their events are later deleted, so a late retry
 * can't re-create something that was removed afterwards. Not exposed in
 * GraphQL.
 */
@Entity('applied_actions')
export class AppliedAction {
  @PrimaryColumn('uuid')
  actionId: string;

  @Index('IDX_applied_actions_gameId')
  @Column('uuid')
  gameId: string;

  @Column('uuid')
  recordedByUserId: string;

  /** Which mutation applied it, e.g. "substitutePlayer". */
  @Column({ length: 50 })
  kind: string;

  /** IDs of the events the action created, in the order it returned them. */
  @Column('uuid', { array: true, default: () => "'{}'" })
  resultEventIds: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'gameId',
    foreignKeyConstraintName: 'FK_applied_actions_gameId',
  })
  game: Game;
}
