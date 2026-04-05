import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EmailAccount } from '../accounts/email-account.entity';
import { EmailImportance, EmailStatus } from '@garage/sift/types';

export { EmailImportance, EmailStatus };

@Entity('emails')
export class Email {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @ManyToOne(() => EmailAccount)
  @JoinColumn({ name: 'accountId' })
  account: EmailAccount;

  @Column({ unique: true })
  gmailMessageId: string;

  @Column()
  subject: string;

  @Column()
  fromAddress: string;

  @Column({ type: 'varchar', nullable: true })
  fromName: string | null;

  @Column({ type: 'text' })
  bodySnippet: string;

  @Column({ type: 'text', nullable: true })
  bodyHtml: string | null;

  @Column({ type: 'timestamp' })
  receivedAt: Date;

  @Column({
    type: 'enum',
    enum: EmailImportance,
    nullable: true,
  })
  importance: EmailImportance | null;

  @Column({ type: 'text', nullable: true })
  importanceReason: string | null;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.UNREAD,
  })
  status: EmailStatus;

  @Column({ type: 'jsonb', nullable: true })
  actionItems: Array<{
    description: string;
    dueDate?: string;
    completed: boolean;
  }> | null;

  @Column({ type: 'text', nullable: true })
  draftReply: string | null;

  @Column({ default: false })
  classified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
