import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

import { AccountProvider } from '@garage/sift/types';

import { encryptedColumnTransformer } from '../../utils/encryption';

export { AccountProvider };

@Entity('email_accounts')
@Unique(['email', 'provider'])
export class EmailAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: AccountProvider,
    default: AccountProvider.GMAIL,
  })
  provider: AccountProvider;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  accessToken: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  refreshToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  displayName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
