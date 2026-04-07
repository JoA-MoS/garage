import type {
  Email,
  EmailStatus,
  EmailImportance,
  ActionType,
  EmailAccount,
} from '@garage/sift/types';

import { apiRequest } from './api-client';

export interface ApiAction {
  id: string;
  emailId: string;
  userId: string;
  type: ActionType;
  description: string;
  draftContent: string | null;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getEmails(filters?: {
  accountId?: string;
  status?: EmailStatus;
  importance?: EmailImportance;
}): Promise<Email[]> {
  const query = {
    accountId: filters?.accountId,
    status: filters?.status,
    importance: filters?.importance,
  };

  return apiRequest<Email[]>('/emails', undefined, query);
}

export async function getActions(filters?: {
  userId?: string;
  completed?: boolean;
}): Promise<ApiAction[]> {
  const query = {
    userId: filters?.userId,
    completed:
      filters?.completed === undefined ? undefined : String(filters.completed),
  };

  return apiRequest<ApiAction[]>('/actions', undefined, query);
}

export async function completeAction(actionId: string): Promise<ApiAction> {
  return apiRequest<ApiAction>(`/actions/${actionId}/complete`, {
    method: 'PATCH',
  });
}

export async function getAccounts(): Promise<EmailAccount[]> {
  return apiRequest<EmailAccount[]>('/accounts');
}
