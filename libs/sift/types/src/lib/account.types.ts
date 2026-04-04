export enum AccountProvider {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
}

export interface EmailAccount {
  id: string;
  userId: string;
  email: string;
  provider: AccountProvider;
  displayName?: string;
  isActive: boolean;
  tokenExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}
