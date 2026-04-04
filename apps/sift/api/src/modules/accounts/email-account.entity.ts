import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AccountProvider {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
}

@Entity('email_accounts')
export class EmailAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: AccountProvider, default: AccountProvider.GMAIL })
  provider: AccountProvider;

  @Column({ type: 'text', nullable: true })
  accessToken: string | null;

  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  displayName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
