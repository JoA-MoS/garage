import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ActionType {
  REPLY = 'reply',
  FORWARD = 'forward',
  CALENDAR_EVENT = 'calendar_event',
  TASK = 'task',
  REVIEW = 'review',
}

@Entity('actions')
export class Action {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  emailId: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: ActionType })
  type: ActionType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  draftContent: string | null;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ default: false })
  completed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
