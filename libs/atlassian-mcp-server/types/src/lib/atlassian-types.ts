// Atlassian API Types
export interface AtlassianIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status?: {
    name: string;
  };
  assignee?: {
    accountId: string;
    displayName: string;
  };
  reporter?: {
    accountId: string;
    displayName: string;
  };
  created: string;
  updated: string;
}

export interface AtlassianProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  lead?: {
    accountId: string;
    displayName: string;
  };
}

export interface AtlassianUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: {
    '48x48': string;
  };
}

export interface AtlassianWorkspace {
  id: string;
  name: string;
  slug: string;
}

// MCP Server Types
export interface McpServerConfig {
  atlassianUrl: string;
  atlassianApiToken: string;
  cloudId?: string;
}

export interface AtlassianClientConfig {
  atlassianUrl: string;
  atlassianApiToken: string;
  cloudId?: string;
}
