export enum EmailImportance {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  SPAM = 'spam',
}

export enum EmailStatus {
  UNREAD = 'unread',
  READ = 'read',
  ACTIONED = 'actioned',
  ARCHIVED = 'archived',
}

export enum ActionType {
  REPLY = 'reply',
  FORWARD = 'forward',
  CALENDAR_EVENT = 'calendar_event',
  TASK = 'task',
  REVIEW = 'review',
}

export interface ActionItem {
  id: string;
  description: string;
  type: ActionType;
  dueDate?: string;
  completed: boolean;
  draftContent?: string;
}

export interface DraftReply {
  subject: string;
  body: string;
  to: string;
}

export interface Email {
  id: string;
  accountId: string;
  gmailMessageId: string;
  subject: string;
  fromAddress: string;
  fromName?: string;
  bodySnippet: string;
  bodyHtml?: string;
  receivedAt: string;
  importance: EmailImportance | null;
  importanceReason?: string;
  status: EmailStatus;
  actionItems?: ActionItem[];
  draftReply?: string;
  classified: boolean;
  createdAt: string;
  updatedAt: string;
}
