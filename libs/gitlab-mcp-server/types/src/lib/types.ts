// GitLab API Types
export interface GitLabProject {
  id: string;
  name: string;
  description?: string;
  webUrl: string;
  namespace?: {
    fullPath: string;
  };
}

export interface GitLabIssue {
  id: string;
  iid: string;
  title: string;
  description?: string;
  state: string;
  webUrl: string;
  author?: {
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GitLabMergeRequest {
  id: string;
  iid: string;
  title: string;
  description?: string;
  state: string;
  webUrl: string;
  author?: {
    name: string;
    username: string;
  };
  sourceBranch: string;
  targetBranch: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitLabPipeline {
  id: string;
  iid: string;
  status: string;
  ref: string;
  webUrl: string;
  createdAt: string;
  updatedAt: string;
}

// MCP Server Types
export interface McpServerConfig {
  gitlabUrl: string;
  gitlabToken: string;
}

export interface GitLabClientConfig {
  gitlabUrl: string;
  gitlabToken: string;
}
